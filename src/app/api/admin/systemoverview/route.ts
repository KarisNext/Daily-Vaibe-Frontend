// frontend/src/app/api/admin/servicesoverview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/servicesoverview/${action}`;
    
    console.log('📊 Services Overview GET:', backendEndpoint);
    
    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          success: false, 
          message: 'Failed to fetch services overview' 
        };
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
    console.error('Services overview API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch services overview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'cleanup';
    
    let body = {};
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (e) {
        console.log('No body for services overview action:', action);
      }
    }
    
    const backendEndpoint = `${getBackendUrl()}/api/admin/servicesoverview/${action}`;
    
    console.log('📊 Services Overview POST:', backendEndpoint);
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          success: false, 
          message: 'Failed to execute services overview action' 
        };
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
    console.error('Services overview POST error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute services overview action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}