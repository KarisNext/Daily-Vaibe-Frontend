// frontend/src/app/api/admin/database-optimization/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path.join('/');
    const backendEndpoint = `${getBackendUrl()}/api/admin/database-optimization/${path}`;
    
    console.log('🔧 Database Optimization GET:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
  } catch (error) {
    console.error('Database optimization API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch database optimization data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path.join('/');
    const backendEndpoint = `${getBackendUrl()}/api/admin/database-optimization/${path}`;
    const body = await request.json();
    
    console.log('🔧 Database Optimization POST:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
  } catch (error) {
    console.error('Database optimization POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute database optimization action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
