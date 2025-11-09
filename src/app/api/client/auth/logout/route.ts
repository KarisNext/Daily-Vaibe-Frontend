// frontend/src/app/api/client/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, forwardCookies, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    if (isDev) {
      console.log(`${ENV_PREFIX} Logging out...`);
    }

    const response = await safeFetch(`${backendUrl}/api/client/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
      timeout: 15000,
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);

    // Clear session cookie on frontend side as well
    nextResponse.cookies.delete('vybeztribe_public_session');

    if (isDev) {
      console.log(`${ENV_PREFIX} ✅ Logout successful`);
    }

    return nextResponse;
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Logout error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
        error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
