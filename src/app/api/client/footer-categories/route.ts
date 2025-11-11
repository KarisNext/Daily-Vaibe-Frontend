// frontend/src/app/api/client/footer-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, createErrorResponse, createSuccessResponse } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  console.log('📂 Footer categories request');
  
  try {
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    // Get backend URL and construct full endpoint
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/footer-categories`;
    console.log('🌐 Fetching from:', fullUrl);

    // Fetch from backend
    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
      
      console.log('📡 Backend response:', response.status);
    } catch (fetchError) {
      console.error('❌ Backend fetch failed:', fetchError);
      return createErrorResponse(
        'Could not connect to backend server',
        503,
        {
          groups: {},
          total_categories: 0,
        }
      );
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      
      return createErrorResponse(
        `Failed to fetch footer categories: ${response.status}`,
        response.status,
        {
          groups: {},
          total_categories: 0,
          backendError: errorText.substring(0, 200),
        }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await response.json();
      console.log('✅ Categories received:', data.total_categories || 'unknown');
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError);
      return createErrorResponse(
        'Invalid response format from backend',
        502,
        {
          groups: {},
          total_categories: 0,
        }
      );
    }
    
    // Create response and forward cookies
    const nextResponse = createSuccessResponse(data);
    forwardCookies(response, nextResponse);

    return nextResponse;

  } catch (error) {
    console.error('💥 Fatal error in footer-categories route:', error);
    
    return createErrorResponse(
      'Internal server error',
      500,
      {
        groups: {},
        total_categories: 0,
        detail: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}
