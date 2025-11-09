// frontend/src/app/api/client/geo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildHeadersFromRequest, forwardCookies, safeFetch } from '@/lib/backend-config';

const isDev = process.env.NODE_ENV === 'development';
const ENV_PREFIX = isDev ? '🔵 [DEV]' : '🟢 [PROD]';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';
    
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    let endpoint = '';
    let queryParams = '';

    switch (action) {
      case 'current':
        endpoint = '/api/geo/current';
        break;
      
      case 'stats':
        endpoint = '/api/geo/stats';
        break;
      
      case 'trends':
        const days = searchParams.get('days') || '7';
        endpoint = '/api/geo/trends';
        queryParams = `?days=${days}`;
        break;
      
      case 'devices':
        endpoint = '/api/geo/devices';
        const category = searchParams.get('category');
        const county = searchParams.get('county');
        const limit = searchParams.get('limit') || '100';
        const offset = searchParams.get('offset') || '0';
        
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (county) params.append('county', county);
        params.append('limit', limit);
        params.append('offset', offset);
        queryParams = `?${params.toString()}`;
        break;
      
      case 'devices-active':
        endpoint = '/api/geo/devices/active';
        break;
      
      case 'county':
        const countyName = searchParams.get('county');
        if (!countyName) {
          return NextResponse.json(
            { success: false, error: 'County name required' },
            { status: 400 }
          );
        }
        endpoint = `/api/geo/county/${countyName}`;
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const response = await safeFetch(`${backendUrl}${endpoint}${queryParams}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      timeout: 10000,
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    console.error(`${ENV_PREFIX} ❌ Geo GET error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch geo data',
        location: { county: null, town: null, category: 'UNKNOWN' }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const backendUrl = getBackendUrl();
    const headers = buildHeadersFromRequest(request);

    let endpoint = '';

    switch (action) {
      case 'update':
        endpoint = '/api/geo/update';
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const response = await safeFetch(`${backendUrl}${endpoint}`, {
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
    console.error(`${ENV_PREFIX} ❌ Geo POST error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update geo data'
      },
      { status: 500 }
    );
  }
}