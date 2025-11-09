// frontend/src/app/api/admin/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vybeztribe.com'
  : 'http://localhost:5000';

/**
 * GET /api/admin/chat/*
 * Proxy GET requests to backend
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract the path after /api/admin/chat
    const path = url.pathname.replace('/api/admin/chat', '');
    const searchParams = url.searchParams.toString();
    
    // Construct backend URL
    const backendEndpoint = `${BACKEND_URL}/api/admin/chat${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Backend responded with status: ${response.status}`,
          message: errorData.message
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    // Forward cookies from backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Admin chat GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin chat data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chat/*
 * Proxy POST requests to backend
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract the path after /api/admin/chat
    const path = url.pathname.replace('/api/admin/chat', '');
    
    // Construct backend URL
    const backendEndpoint = `${BACKEND_URL}/api/admin/chat${path}`;
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      // No body or invalid JSON
    }
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Backend responded with status: ${response.status}`,
          message: errorData.message
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    // Forward cookies from backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Admin chat POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute admin chat action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chat/*
 * Proxy DELETE requests to backend
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract the path after /api/admin/chat
    const path = url.pathname.replace('/api/admin/chat', '');
    
    // Construct backend URL
    const backendEndpoint = `${BACKEND_URL}/api/admin/chat${path}`;
    
    const response = await fetch(backendEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Backend responded with status: ${response.status}`,
          message: errorData.message
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    // Forward cookies from backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Admin chat DELETE API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete admin chat data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}