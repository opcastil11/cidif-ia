import { NextResponse } from 'next/server';

/**
 * GET /api/orquesta/embed-token
 * Fetches the Orquesta embed token from the Orquesta backend
 * This keeps the token secure by fetching it server-side
 */
export async function GET() {
  const orquestaToken = process.env.ORQUESTA_TOKEN;
  const projectId = 'fb324d50-c231-4aa4-93b6-cfc424a449d0';

  if (!orquestaToken) {
    console.error('[Orquesta] ORQUESTA_TOKEN not configured');
    return NextResponse.json(
      { error: 'Orquesta not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch the embed token from Orquesta backend
    const response = await fetch(
      `https://orquesta.live/api/projects/${projectId}/embed-token`,
      {
        headers: {
          'X-Agent-Token': orquestaToken,
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Orquesta] Failed to fetch embed token:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch embed token' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.token || data.embedToken
    });
  } catch (error) {
    console.error('[Orquesta] Error fetching embed token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
