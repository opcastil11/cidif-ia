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
    // Forward all relevant headers from the original request
    // Always inject the embed token for authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMBED_TOKEN}`,
    };

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
        headers[headerName] = headerValue;
        console.log(`[Orquesta Proxy] Forwarding header ${headerName}: ${headerValue.substring(0, 50)}...`);
      }
    }

    // Also forward authorization if client sends one (override our default)
    const clientAuth = request.headers.get('authorization');
    if (clientAuth) {
      headers['Authorization'] = clientAuth;
      console.log(`[Orquesta Proxy] Using client-provided Authorization header`);
    } else {
      console.log(`[Orquesta Proxy] Using server-side embed token for auth`);
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
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

    const response = await fetch(targetUrl, fetchOptions);

    // Get response as text first to handle empty responses
    const responseText = await response.text();

    console.log(`[Orquesta Proxy] Response status: ${response.status}`);

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
