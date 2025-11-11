// frontend/src/app/api/client/footer-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  console.log('🔍 Footer categories route called');
  
  try {
    const backendUrl = getBackendUrl();
    console.log('🌐 Backend URL:', backendUrl);
    
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (request.headers.has('cookie')) {
      headers.set('Cookie', request.headers.get('cookie')!);
      console.log('🍪 Cookie forwarded');
    }

    const fullUrl = `${backendUrl}/api/footer-categories`;
    console.log('📡 Fetching from:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
      cache: 'no-store',
    });

    console.log('✅ Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch footer categories: ${response.status}`,
          backendUrl: fullUrl,
          error: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📦 Data received, categories:', data.total_categories);
    
    const nextResponse = NextResponse.json(data);
    
    console.log('🍪 Attempting to forward cookies...');
    try {
      forwardCookies(response, nextResponse);
      console.log('✅ Cookies forwarded successfully');
    } catch (cookieError) {
      console.error('❌ Cookie forwarding failed:', cookieError);
      // Don't fail the whole request if cookie forwarding fails
    }

    return nextResponse;

  } catch (error) {
    console.error('💥 Fatal error in footer-categories route:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        groups: {},
        total_categories: 0
      },
      { status: 500 }
    );
  }
}
