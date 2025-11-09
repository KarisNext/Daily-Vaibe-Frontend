
// frontend/src/app/api/client/auth/session-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function GET(request: NextRequest) {
  // Only available in development
  if (!isDev) {
    return NextResponse.json(
      {
        success: false,
        message: 'Session info endpoint is only available in development',
        timestamp: new Date().toISOString()
      },
      { status: 403 }
    );
  }

  try {
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    console.log(`${ENV_PREFIX} Fetching session info...`);

    const response = await safeFetch(`${backendUrl}/api/client/auth/session-info`, {
      method: 'GET',
      headers,
      credentials: 'include',
      timeout: 15000,
    });

    const data = await response.json();

    console.log(`${ENV_PREFIX} Session info retrieved:`, {
      hasSession: !!data.session?.id,
      isAuthenticated: !data.session?.data?.is_anonymous
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Session info error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get session info',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
