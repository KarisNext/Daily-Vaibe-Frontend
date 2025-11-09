// frontend/src/app/api/client/auth/anonymous/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, forwardCookies, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    if (isDev) {
      console.log(`${ENV_PREFIX} Creating anonymous session...`);
    }

    const response = await safeFetch(`${backendUrl}/api/client/auth/anonymous`, {
      method: 'POST',
      headers,
      credentials: 'include',
      timeout: 15000,
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);

    if (isDev) {
      console.log(`${ENV_PREFIX} Anonymous session created:`, {
        success: data.success,
        clientId: data.client_id?.substring(0, 15) + '...'
      });
    }

    return nextResponse;
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Anonymous session error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create anonymous session',
        error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}