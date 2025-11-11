
// frontend/src/lib/backend-config.ts
import { NextRequest, NextResponse } from 'next/server';

// ===============================================
// 1. ENVIRONMENT CONFIGURATION
// ===============================================

export const getBackendUrl = (): string => {
  // Check if we're in production based on multiple signals
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.VERCEL_ENV === 'production' ||
    process.env.RENDER === 'true';
  
  if (isProduction) {
    // Production: Use BACKEND_URL or fallback to your API domain
    const backendUrl = process.env.BACKEND_URL || 
                       process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'https://api.vybeztribe.com';
    
    console.log('🌐 [PRODUCTION] Backend URL:', backendUrl);
    return backendUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Development: Use local backend
  const backendUrl = process.env.BACKEND_URL || 
                     process.env.NEXT_PUBLIC_BACKEND_URL || 
                     'http://localhost:5000';
  
  console.log('🔧 [DEVELOPMENT] Backend URL:', backendUrl);
  return backendUrl.replace(/\/$/, ''); // Remove trailing slash
};

// ===============================================
// 2. HEADER UTILITIES
// ===============================================

/**
 * Builds standard headers for a request going from the frontend to the backend.
 * It ensures the Content-Type is application/json and forwards the 'Cookie' header
 * and 'User-Agent' from the incoming NextRequest.
 */
export const buildHeadersFromRequest = (
  request: NextRequest, 
  additionalHeaders: HeadersInit = {}
): HeadersInit => {
  try {
    const incomingHeaders = request.headers;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Safely get cookie
    const cookie = incomingHeaders.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    
    // Safely get user agent
    const userAgent = incomingHeaders.get('user-agent');
    if (userAgent) {
      headers['User-Agent'] = userAgent;
    }
    
    // Merge additional headers, allowing them to override defaults
    const mergedHeaders = new Headers(headers);
    
    if (additionalHeaders) {
      const additionalHeadersObj = new Headers(additionalHeaders);
      additionalHeadersObj.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    }

    return mergedHeaders;
  } catch (error) {
    console.error('❌ Error building headers:', error);
    // Return minimal safe headers
    return {
      'Content-Type': 'application/json',
    };
  }
};

// ===============================================
// 3. COOKIE UTILITY (FIXED - THIS WAS YOUR PROBLEM!)
// ===============================================

/**
 * Forwards Set-Cookie headers from the backend response to the Next.js response.
 * This is bulletproof - it handles all edge cases and won't crash.
 */
export const forwardCookies = (
  backendResponse: Response, 
  nextResponse: NextResponse
): void => {
  try {
    // Method 1: Try getSetCookie() - modern approach
    if (typeof backendResponse.headers.getSetCookie === 'function') {
      const setCookieHeaders = backendResponse.headers.getSetCookie();
      
      if (setCookieHeaders && Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          if (cookie && typeof cookie === 'string') {
            nextResponse.headers.append('Set-Cookie', cookie);
          }
        });
        return; // Success - exit early
      }
    }
    
    // Method 2: Fallback to get('set-cookie') - older approach
    const setCookieHeader = backendResponse.headers.get('set-cookie');
    
    if (setCookieHeader) {
      // Handle multiple cookies separated by commas (if any)
      const cookies = setCookieHeader.split(/,(?=\s*\w+\=)/);
      
      cookies.forEach(cookie => {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie) {
          nextResponse.headers.append('Set-Cookie', trimmedCookie);
        }
      });
      return; // Success
    }
    
    // No cookies found - this is OK, not an error
    console.log('ℹ️ No cookies to forward from backend');
    
  } catch (error) {
    // Cookie forwarding failed, but DON'T crash the request
    console.warn('⚠️ Cookie forwarding failed (non-critical):', error);
    // Continue - the request can still succeed without cookies
  }
};

// ===============================================
// 4. GENERAL FETCH UTILITY (ENHANCED)
// ===============================================

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000; // Increased to 30s for production

/**
 * Performs a fetch request with standard options, a configurable timeout,
 * and robust error handling.
 */
export async function safeFetch(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Ensure headers is always defined as HeadersInit for type safety
  const finalHeaders: HeadersInit = headers || {};

  const defaultOptions: RequestInit = {
    method: 'GET',
    cache: 'no-store', // Changed from 'no-cache' for better production behavior
    credentials: 'include',
  };

  try {
    console.log(`📡 Fetching: ${url}`);
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...rest,
      signal: controller.signal,
      headers: {
        ...defaultOptions.headers,
        ...finalHeaders,
      } as HeadersInit,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ Response: ${response.status} from ${url}`);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Timeout: ${url} took longer than ${timeout}ms`);
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }
      
      console.error(`❌ Fetch error for ${url}:`, error.message);
      throw error;
    }
    
    console.error(`❌ Unknown fetch error for ${url}:`, error);
    throw new Error('Unknown fetch error occurred');
  }
}

// ===============================================
// 5. RESPONSE HELPERS
// ===============================================

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  additionalData: Record<string, any> = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      ...additionalData,
    },
    { status: statusCode }
  );
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}
