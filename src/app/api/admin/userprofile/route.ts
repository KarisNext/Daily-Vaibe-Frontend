import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vybeztribe.com'
  : 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const csrfToken = request.headers.get('x-csrf-token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/userprofile`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return NextResponse.json(
        { 
          success: false, 
          message: response.statusText || 'Failed to fetch user profile',
          error: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const nextResponse = NextResponse.json(data);

    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      nextResponse.headers.set('set-cookie', setCookieHeaders);
    }

    return nextResponse;

  } catch (error) {
    console.error('User profile API route error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}