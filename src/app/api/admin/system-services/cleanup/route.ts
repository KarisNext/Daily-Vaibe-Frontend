// frontend/src/app/api/admin/system-services/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/system-services/cleanup${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to fetch cleanup data' };
      }
      return NextResponse.json(errorData, { status: response.status });
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
    console.error('Cleanup GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process cleanup request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    let body = {};
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (e) {
        console.log('No body for cleanup request');
      }
    }
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/system-services/cleanup${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to execute cleanup action' };
      }
      return NextResponse.json(errorData, { status: response.status });
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
    console.error('Cleanup POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process cleanup action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}