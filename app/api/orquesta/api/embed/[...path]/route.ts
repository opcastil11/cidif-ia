import { NextRequest, NextResponse } from 'next/server';

const ORQUESTA_BASE_URL = 'https://orquesta.live/api/embed';

// Hardcoded token for server-side auth with Orquesta
const EMBED_TOKEN = 'oek_z5AV0KV1PvXJWnB3oPuHzNpLkelGaNOPH69ZdW_0bdA';

// Generic proxy handler for all Orquesta embed API endpoints
async function proxyRequest(request: NextRequest, path: string[], method: string) {
  const endpoint = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  const targetUrl = `${ORQUESTA_BASE_URL}/${endpoint}${queryString}`;

  // Log incoming request headers for debugging
  const incomingHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    incomingHeaders[key] = value;
  });
  console.log(`[Orquesta Proxy] ${method} ${targetUrl}`);
  console.log(`[Orquesta Proxy] Incoming headers:`, JSON.stringify(incomingHeaders, null, 2));

  try {
    // Build headers for the outgoing request
    // Create a new Headers object to ensure proper handling
    const outgoingHeaders = new Headers();
    outgoingHeaders.set('Content-Type', 'application/json');

    // Always inject the embed token for authentication
    // This is the critical auth header for Orquesta API
    outgoingHeaders.set('Authorization', `Bearer ${EMBED_TOKEN}`);

    console.log(`[Orquesta Proxy] Set Authorization header: Bearer ${EMBED_TOKEN.substring(0, 20)}...`);

    // List of headers to forward - include more potential auth headers
    const headersToForward = [
      'x-orquesta-api-key',
      'x-embed-token',
      'x-api-key',
      'cookie',
      'x-client-info',
    ];

    for (const headerName of headersToForward) {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        outgoingHeaders.set(headerName, headerValue);
        console.log(`[Orquesta Proxy] Forwarding header ${headerName}: ${headerValue.substring(0, 50)}...`);
      }
    }

    // Also forward authorization if client sends one (override our default)
    const clientAuth = request.headers.get('authorization');
    if (clientAuth) {
      outgoingHeaders.set('Authorization', clientAuth);
      console.log(`[Orquesta Proxy] Using client-provided Authorization header instead`);
    } else {
      console.log(`[Orquesta Proxy] Using server-side embed token for auth`);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: outgoingHeaders,
    };

    // Add body for methods that support it
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // No body to forward
      }
    }

    // Log outgoing request details
    const headersObj: Record<string, string> = {};
    outgoingHeaders.forEach((value, key) => {
      headersObj[key] = key.toLowerCase() === 'authorization' ? `${value.substring(0, 30)}...` : value;
    });
    console.log(`[Orquesta Proxy] Outgoing headers:`, JSON.stringify(headersObj, null, 2));
    console.log(`[Orquesta Proxy] Fetching: ${targetUrl}`);

    const response = await fetch(targetUrl, fetchOptions);

    // Get response as text first to handle empty responses
    const responseText = await response.text();

    console.log(`[Orquesta Proxy] Response status: ${response.status}`);
    console.log(`[Orquesta Proxy] Response body: ${responseText.substring(0, 200)}`);

    // Return appropriate response
    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        return NextResponse.json(data, { status: response.status });
      } catch {
        // Not JSON, return as text
        return new NextResponse(responseText, { status: response.status });
      }
    } else {
      return new NextResponse(null, { status: response.status });
    }
  } catch (error) {
    console.error(`[Orquesta Proxy] Error proxying ${method} /${endpoint}:`, error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Handle all HTTP methods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
