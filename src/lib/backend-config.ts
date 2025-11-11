// frontend/src/lib/backend-config.ts
import { NextRequest, NextResponse } from 'next/server';

// ===============================================
// 1. ENVIRONMENT CONFIGURATION
// ===============================================

export const getBackendUrl = (): string => {
  // Check multiple production indicators
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.VERCEL_ENV === 'production' ||
    process.env.RENDER === 'true';
  
  const backendUrl = isProduction
    ? (process.env.BACKEND_URL || 'https://api.vybeztribe.com')
    : (process.env.BACKEND_URL || 'http://localhost:5000');
  
  // Remove trailing slash
  const cleanUrl = backendUrl.replace(/\/$/, '');
  
  console.log(`[${isProduction ? 'PROD' : 'DEV'}] Backend URL: ${cleanUrl}`);
  return cleanUrl;
};

// ===============================================
// 2. HEADER UTILITIES
// ===============================================

/**
 * Builds standard headers for a request going from the frontend to the backend.
 * Safely forwards Cookie and User-Agent headers.
 */
export const buildHeadersFromRequest = (
  request: NextRequest, 
  additionalHeaders: HeadersInit = {}
): HeadersInit => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Safely forward cookie
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    
    // Safely forward user agent
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      headers['User-Agent'] = userAgent;
    }
    
    // Merge additional headers
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
    return { 'Content-Type': 'application/json' };
  }
};

// ===============================================
// 3. COOKIE UTILITY - COMPLETELY BULLETPROOF
// ===============================================

/**
 * Forwards Set-Cookie headers from backend to Next.js response.
 * THIS IS THE CRITICAL FIX - handles all edge cases without crashing.
 */
export const forwardCookies = (
  backendResponse: Response, 
  nextResponse: NextResponse
): void => {
  if (!backendResponse || !nextResponse) {
    console.warn('⚠️ Invalid response objects for cookie forwarding');
    return;
  }

  try {
    // Check if response and headers exist
    if (!backendResponse.headers) {
      console.log('ℹ️ No headers object in backend response');
      return;
    }

    // METHOD 1: Try getSetCookie() (modern, preferred)
    if (typeof backendResponse.headers.getSetCookie === 'function') {
      try {
        const cookieArray = backendResponse.headers.getSetCookie();
        
        if (cookieArray && Array.isArray(cookieArray) && cookieArray.length > 0) {
          let forwardedCount = 0;
          cookieArray.forEach(cookie => {
            if (cookie && typeof cookie === 'string' && cookie.trim()) {
              nextResponse.headers.append('Set-Cookie', cookie);
              forwardedCount++;
            }
          });
          
          if (forwardedCount > 0) {
            console.log(`✅ Forwarded ${forwardedCount} cookie(s) via getSetCookie()`);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ getSetCookie() failed:', err);
        // Continue to fallback method
      }
    }
    
    // METHOD 2: Fallback to get('set-cookie')
    try {
      const setCookieHeader = backendResponse.headers.get('set-cookie');
      
      if (setCookieHeader && typeof setCookieHeader === 'string') {
        // Split by comma, but be careful not to split within cookie values
        // This regex splits on ", " followed by a word character and "="
        const cookies = setCookieHeader.split(/,(?=\s*\w+=)/);
        
        let forwardedCount = 0;
        cookies.forEach(cookie => {
          const trimmedCookie = cookie.trim();
          if (trimmedCookie) {
            nextResponse.headers.append('Set-Cookie', trimmedCookie);
            forwardedCount++;
          }
        });
        
        if (forwardedCount > 0) {
          console.log(`✅ Forwarded ${forwardedCount} cookie(s) via get()`);
          return;
        }
      }
    } catch (err) {
      console.warn('⚠️ get(set-cookie) failed:', err);
    }
    
    // No cookies found - this is normal, not an error
    console.log('ℹ️ No Set-Cookie headers found in backend response');
    
  } catch (error) {
    // Catch-all: Log but NEVER throw
    console.warn('⚠️ Cookie forwarding encountered error (non-critical):', error);
  }
};

// ===============================================
// 4. GENERAL FETCH UTILITY
// ===============================================

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds for production

/**
 * Performs a fetch request with timeout and robust error handling.
 */
export async function safeFetch(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const finalHeaders: HeadersInit = headers || {};

  const defaultOptions: RequestInit = {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  };

  try {
    console.log(`📡 Fetching: ${url.substring(0, 100)}...`);
    
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
    console.log(`✅ ${response.status} from ${url.substring(0, 100)}...`);
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const errMsg = `Request timeout after ${timeout}ms: ${url}`;
        console.error(`⏱️ ${errMsg}`);
        throw new Error(errMsg);
      }
      
      console.error(`❌ Fetch error: ${error.message}`);
      throw error;
    }
    
    console.error(`❌ Unknown fetch error:`, error);
    throw new Error('Unknown fetch error occurred');
  }
}

// ===============================================
// 5. STANDARDIZED RESPONSE HELPERS
// ===============================================

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  additionalData: Record<string, any> = {}
): NextResponse {
  console.error(`🔴 Error Response [${statusCode}]: ${message}`);
  
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      timestamp: new Date().toISOString(),
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

// ===============================================
// 6. ROUTE HANDLER WRAPPER (NEW!)
// ===============================================

/**
 * Wraps API route handlers with consistent error handling
 * Use this to eliminate try-catch boilerplate
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('💥 Unhandled error in route:', error);
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        {
          path: request.nextUrl.pathname,
          method: request.method,
        }
      );
    }
  };
}
