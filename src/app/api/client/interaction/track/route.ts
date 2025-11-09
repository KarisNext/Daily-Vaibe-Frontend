// frontend/src/app/api/client/interactions/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, forwardCookies, safeFetch } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    const response = await safeFetch(`${backendUrl}/api/interactions/track`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
      timeout: 10000,
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track interaction'
      },
      { status: 500 }
    );
  }
}