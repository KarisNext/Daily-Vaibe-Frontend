// frontend/src/components/client/hooks/useCategory.tsx
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';
import { NewsItem } from './useArticle';

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

interface UseCategoryReturn {
  loadMoreNews: (slug: string, page: number, limit?: number) => Promise<NewsItem[]>;
  isLoadingMore: boolean;
  loadMoreError: string | null;
}

export const useCategory = (): UseCategoryReturn => {
  const { sessionToken } = useClientSession();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const normalizeNewsItem = useCallback((item: any): NewsItem => {
    const firstName = item.first_name || 'Anonymous';
    const lastName = item.last_name || '';

    return {
      news_id: item.news_id || 0,
      title: item.title || 'Untitled',
      content: '',
      excerpt: item.excerpt || '',
      slug: item.slug || '',
      category_id: item.category_id || 0,
      category_name: item.category_name || 'Uncategorized',
      category_slug: item.category_slug || 'uncategorized',
      featured: Boolean(item.featured),
      image_url: item.image_url || '',
      status: item.status || 'published',
      priority: item.priority || 'medium',
      tags: item.tags || '',
      reading_time: parseInt(item.reading_time) || 5,
      views: parseInt(item.views) || 0,
      likes_count: parseInt(item.likes_count) || 0,
      comments_count: parseInt(item.comments_count) || 0,
      share_count: parseInt(item.share_count) || 0,
      first_name: firstName,
      last_name: lastName,
      author_email: item.author_email || '',
      published_at: item.published_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
  }, []);

  const loadMoreNews = useCallback(async (slug: string, page: number, limit: number = 20): Promise<NewsItem[]> => {
    if (!slug || slug.trim() === '') {
      setLoadMoreError('Invalid category slug');
      return [];
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const url = `/api/client/category?slug=${encodeURIComponent(slug)}&type=news&page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newsItems = (data.news || []).map(normalizeNewsItem);
        setLoadMoreError(null);
        return newsItems;
      } else {
        setLoadMoreError(data.message || 'Failed to load more news');
        return [];
      }
    } catch (err) {
      console.error('Load more error:', err);
      setLoadMoreError(`Failed to load more news: ${err}`);
      return [];
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionToken, normalizeNewsItem]);

  return {
    loadMoreNews,
    isLoadingMore,
    loadMoreError
  };
};