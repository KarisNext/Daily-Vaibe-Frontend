// frontend/src/app/api/client/auth/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();

    const response = await safeFetch(`${backendUrl}/api/client/auth/health`, {
      method: 'GET',
      timeout: 10000,
    });

    const data = await response.json();

    return NextResponse.json({
      ...data,
      frontend: {
        status: 'healthy',
        environment: isDev ? 'development' : 'production',
        backendUrl,
        timestamp: new Date().toISOString()
      }
    }, { status: response.status });
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Health check error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        service: 'Client Auth Frontend Routes',
        status: 'unhealthy',
        message: 'Backend health check failed',
        error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}