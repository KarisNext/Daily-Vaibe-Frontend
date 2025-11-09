// frontend/src/app/api/client/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'news';
    
    let backendUrl = '';
    const params = new URLSearchParams();
    
    searchParams.forEach((value, key) => {
      if (key !== 'type') {
        params.set(key, value);
      }
    });
    
    switch (type) {
      case 'category':
        const category = searchParams.get('category');
        if (!category) {
          return NextResponse.json({ success: false, message: 'Category required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/news/category/${category}`;
        break;
        
      case 'article':
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json({ success: false, message: 'Article slug required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/articles/${slug}`;
        break;
        
      case 'article-media':
        const mediaSlug = searchParams.get('slug');
        if (!mediaSlug) {
          return NextResponse.json({ success: false, message: 'Article slug required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/articles/${mediaSlug}/media`;
        break;
        
      case 'breaking':
        backendUrl = `${getBackendUrl()}/api/news/breaking`;
        break;
        
      case 'featured':
        backendUrl = `${getBackendUrl()}/api/news/featured`;
        break;
        
      case 'trending':
        backendUrl = `${getBackendUrl()}/api/news/trending`;
        break;
        
      case 'categories':
        backendUrl = `${getBackendUrl()}/api/news/categories`;
        break;
        
      case 'search':
        backendUrl = `${getBackendUrl()}/api/news`;
        const query = searchParams.get('q');
        if (query) params.set('search', query);
        break;
        
      case 'comments':
        const commentSlug = searchParams.get('slug');
        if (!commentSlug) {
          return NextResponse.json({ success: false, message: 'Article slug required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/articles/${commentSlug}/comments`;
        break;
        
      case 'replies':
        const replySlug = searchParams.get('slug');
        const commentId = searchParams.get('commentId');
        if (!replySlug || !commentId) {
          return NextResponse.json({ success: false, message: 'Slug and comment ID required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/articles/${replySlug}/replies/${commentId}`;
        break;
        
      default:
        backendUrl = `${getBackendUrl()}/api/news`;
    }
    
    const queryString = params.toString();
    const fullUrl = `${backendUrl}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      cache: type === 'article' || type === 'article-media' ? 'no-store' : 'default'
    });
    
    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`
      }, { status: response.status });
    }
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug, id } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        message: 'Action required'
      }, { status: 400 });
    }
    
    let endpoint = '';
    let method = 'POST';
    
    switch (action) {
      case 'view':
        if (!slug) {
          return NextResponse.json({
            success: false,
            message: 'Article slug required for view tracking'
          }, { status: 400 });
        }
        endpoint = `${getBackendUrl()}/api/articles/${slug}/view`;
        break;
        
      case 'like':
        if (!slug) {
          return NextResponse.json({
            success: false,
            message: 'Article slug required for like'
          }, { status: 400 });
        }
        endpoint = `${getBackendUrl()}/api/articles/${slug}/like`;
        break;
        
      case 'share':
        if (!id) {
          return NextResponse.json({
            success: false,
            message: 'Article ID required for share'
          }, { status: 400 });
        }
        endpoint = `${getBackendUrl()}/api/news/share/${id}`;
        break;
        
      case 'update-media':
        if (!slug) {
          return NextResponse.json({
            success: false,
            message: 'Article slug required for media update'
          }, { status: 400 });
        }
        endpoint = `${getBackendUrl()}/api/articles/${slug}/media`;
        break;
        
      case 'comment':
        if (!slug) {
          return NextResponse.json({
            success: false,
            message: 'Article slug required for comment'
          }, { status: 400 });
        }
        endpoint = `${getBackendUrl()}/api/articles/${slug}/comments`;
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }
    
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Action failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, images, videos } = body;
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Article slug required'
      }, { status: 400 });
    }
    
    const endpoint = `${getBackendUrl()}/api/articles/${slug}/media`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({ images, videos })
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('PUT API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Update failed'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const mediaType = searchParams.get('mediaType'); // 'image' or 'video'
    const mediaId = searchParams.get('mediaId');
    
    if (!slug || !mediaType || !mediaId) {
      return NextResponse.json({
        success: false,
        message: 'Slug, media type, and media ID required'
      }, { status: 400 });
    }
    
    const endpoint = `${getBackendUrl()}/api/articles/${slug}/media/${mediaType}/${mediaId}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('DELETE API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Delete failed'
    }, { status: 500 });
  }
}