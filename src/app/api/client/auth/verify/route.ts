// frontend/src/app/api/client/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, forwardCookies, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    if (isDev) {
      console.log(`${ENV_PREFIX} Verifying session...`);
    }

    const response = await safeFetch(`${backendUrl}/api/client/auth/verify`, {
      method: 'GET',
      headers,
      credentials: 'include',
      timeout: 15000,
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);

    if (isDev) {
      console.log(`${ENV_PREFIX} Session verification:`, {
        isAuthenticated: data.isAuthenticated,
        isAnonymous: data.isAnonymous,
        hasClientId: !!data.client_id
      });
    }

    return nextResponse;
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Session verification error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'Session verification failed',
        error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
