// frontend/src/app/api/admin/geo/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/geo/${path}${queryString ? `?${queryString}` : ''}`;
    
    console.log('🌍 Admin Geo GET:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include',
      cache: 'no-store'
    });

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
    console.error('Admin geo GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch geo data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/geo/${path}`;
    
    console.log('🌍 Admin Geo POST:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store'
    });

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
    console.error('Admin geo POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute geo action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/geo/${path}`;
    
    console.log('🌍 Admin Geo PUT:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'PUT',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store'
    });

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
    console.error('Admin geo PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update geo data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}