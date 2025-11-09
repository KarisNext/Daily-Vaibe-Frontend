import { cookies } from 'next/headers';
import type { SessionData, NewsArticle, Category } from './clientData';
import { normalizeArticle, normalizeArticles } from './clientData';

interface HomeContent {
  breaking_news: NewsArticle[];
  featured_news: NewsArticle[];
  trending_news: NewsArticle[];
  categories: Category[];
  category_previews: {
    [key: string]: NewsArticle[];
  };
}

interface CategoryContent {
  category: Category | null;
  news: NewsArticle[];
  pagination: {
    current_page: number;
    per_page: number;
    total_news: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface ArticleContent {
  article: NewsArticle & {
    content: string; // Override to make content required
    category_color?: string;
    category_icon?: string;
  };
  related_articles: NewsArticle[];
}

function getBackendUrl(): string {
  return process.env.NODE_ENV === 'development'
    ? process.env.BACKEND_URL || 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://api.vybeztribe.com';
}

function createBackendHeaders(sessionCookie?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (sessionCookie) {
    headers['Cookie'] = `vybeztribe_public_session=${sessionCookie}`;
  }

  return headers;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  }
}

export async function getServerSessionData(): Promise<SessionData> {
  const API_BASE_URL = getBackendUrl();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('vybeztribe_public_session')?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, isAnonymous: true, client_id: null, csrf_token: null };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/client/auth/verify`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      8000
    );

    if (!response.ok) {
      return { isAuthenticated: false, isAnonymous: true, client_id: null, csrf_token: null };
    }

    const data = await response.json();
    
    return {
      isAuthenticated: data.isAuthenticated || false,
      isAnonymous: data.isAnonymous || true,
      client_id: data.client_id || null,
      csrf_token: data.csrf_token || null,
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return { isAuthenticated: false, isAnonymous: true, client_id: null, csrf_token: null };
  }
}

export async function fetchHomeContent(): Promise<HomeContent> {
  const API_BASE_URL = getBackendUrl();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('vybeztribe_public_session')?.value;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/client/home?type=all`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      15000
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch home content: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize all articles to ensure proper typing
    const processedCategoryPreviews: { [key: string]: NewsArticle[] } = {};
    if (data.category_previews) {
      Object.keys(data.category_previews).forEach(key => {
        processedCategoryPreviews[key] = normalizeArticles(data.category_previews[key] || []);
      });
    }
    
    return {
      breaking_news: normalizeArticles(data.breaking_news || []),
      featured_news: normalizeArticles(data.featured_news || []),
      trending_news: normalizeArticles(data.trending_news || []),
      categories: data.categories || [],
      category_previews: processedCategoryPreviews,
    };
  } catch (error) {
    console.error('Failed to fetch home content:', error);
    return {
      breaking_news: [],
      featured_news: [],
      trending_news: [],
      categories: [],
      category_previews: {},
    };
  }
}

export async function fetchCategoryContent(
  slug: string,
  page: number = 1,
  limit: number = 20
): Promise<CategoryContent> {
  const API_BASE_URL = getBackendUrl();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('vybeztribe_public_session')?.value;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/categories/${slug}/news?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      12000
    );

    if (!response.ok) {
      return {
        category: null,
        news: [],
        pagination: {
          current_page: 1,
          per_page: limit,
          total_news: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };
    }

    const data = await response.json();
    
    return {
      category: data.category || null,
      news: normalizeArticles(data.news || []),
      pagination: data.pagination || {
        current_page: 1,
        per_page: limit,
        total_news: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch category ${slug}:`, error);
    return {
      category: null,
      news: [],
      pagination: {
        current_page: 1,
        per_page: limit,
        total_news: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
}

export async function fetchGroupContent(
  slug: string,
  page: number = 1,
  limit: number = 20
): Promise<CategoryContent> {
  const API_BASE_URL = getBackendUrl();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('vybeztribe_public_session')?.value;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/category-groups/${slug}/news?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      12000
    );

    if (!response.ok) {
      console.error(`Failed to fetch group ${slug}: ${response.status}`);
      return {
        category: null,
        news: [],
        pagination: {
          current_page: 1,
          per_page: limit,
          total_news: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };
    }

    const data = await response.json();
    
    return {
      category: data.category || null,
      news: normalizeArticles(data.news || []),
      pagination: data.pagination || {
        current_page: 1,
        per_page: limit,
        total_news: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  } catch (error) {
    console.error(`Error fetching group content for ${slug}:`, error);
    return {
      category: null,
      news: [],
      pagination: {
        current_page: 1,
        per_page: limit,
        total_news: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
}

export async function fetchArticleContent(slug: string): Promise<ArticleContent | null> {
  const API_BASE_URL = getBackendUrl();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('vybeztribe_public_session')?.value;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/client/article?slug=${slug}`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      12000
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.article) {
      return null;
    }

    const relatedResponse = await fetchWithTimeout(
      `${API_BASE_URL}/api/categories/${data.article.category_slug}/news?limit=15`,
      {
        method: 'GET',
        headers: createBackendHeaders(sessionCookie),
        cache: 'no-store',
        credentials: 'include',
      },
      10000
    );

    let relatedArticles: NewsArticle[] = [];
    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();
      relatedArticles = normalizeArticles(
        (relatedData.news || []).filter(
          (article: any) => article.slug !== slug
        )
      );
    }

    // Normalize the article and ensure content is always a string
    const normalizedArticle = normalizeArticle(data.article);
    
    return {
      article: {
        ...normalizedArticle,
        content: normalizedArticle.content || '', // Ensure content is never undefined
        category_color: data.article.category_color,
        category_icon: data.article.category_icon,
      },
      related_articles: relatedArticles,
    };
  } catch (error) {
    console.error(`Failed to fetch article ${slug}:`, error);
    return null;
  }
}

export type {
  HomeContent,
  CategoryContent,
  ArticleContent,
};