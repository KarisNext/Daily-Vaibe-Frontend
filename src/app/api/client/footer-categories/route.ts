import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (request.headers.has('cookie')) {
      headers.set('Cookie', request.headers.get('cookie')!);
    }

    const backendUrl = `${getBackendUrl()}/api/footer-categories`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch footer categories: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data);
    forwardCookies(response, nextResponse);

    return nextResponse;

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        groups: {},
        total_categories: 0
      },
      { status: 500 }
    );
  }
}