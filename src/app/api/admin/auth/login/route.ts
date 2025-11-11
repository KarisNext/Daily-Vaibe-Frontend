// frontend/src/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, createErrorResponse } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  console.log('🔐 Admin login attempt started');
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📝 Login request for:', body.username || body.email || 'unknown');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return createErrorResponse('Invalid request body', 400);
    }
    
    // Get backend URL
    const backendUrl = getBackendUrl();
    const loginUrl = `${backendUrl}/api/admin/auth/login`;
    console.log('🌐 Forwarding to:', loginUrl);
    
    // Get cookies from request
    const requestCookies = request.headers.get('cookie') || '';
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Admin',
    };
    
    if (requestCookies) {
      headers['Cookie'] = requestCookies;
    }
    
    // Call backend
    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });
      
      console.log('📡 Backend responded:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('❌ Backend fetch failed:', fetchError);
      return createErrorResponse(
        'Could not connect to authentication server',
        503,
        { detail: fetchError instanceof Error ? fetchError.message : 'Network error' }
      );
    }
    
    // Parse backend response
    let data;
    try {
      const text = await response.text();
      console.log('📦 Backend response length:', text.length, 'bytes');
      
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      console.error('❌ Failed to parse backend JSON:', jsonError);
      return createErrorResponse('Invalid response from authentication server', 502);
    }
    
    // Create Next.js response
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookies from backend
    console.log('🍪 Forwarding cookies...');
    forwardCookies(response, nextResponse);
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful');
    } else {
      console.log('❌ Admin login failed:', data.message || 'Unknown error');
    }
    
    return nextResponse;
    
  } catch (error) {
    console.error('💥 Fatal error in admin login route:', error);
    
    return createErrorResponse(
      'Login request failed',
      500,
      {
        detail: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? error.stack 
          : undefined,
      }
    );
  }
}
