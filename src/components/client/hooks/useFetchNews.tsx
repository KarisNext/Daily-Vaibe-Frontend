// frontend/src/components/client/hooks/useFetchNews.tsx
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';
import { NewsItem } from './useArticle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vybeztribe.com';

interface UseFetchNewsReturn {
  searchNews: (query: string, page?: number, limit?: number) => Promise<NewsItem[]>;
  isSearching: boolean;
  searchError: string | null;
}

export const useFetchNews = (): UseFetchNewsReturn => {
  const { sessionToken } = useClientSession();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const normalizeNewsItem = useCallback((item: any): NewsItem => {
    return {
      news_id: item.news_id || 0,
      title: item.title || 'Untitled',
      content: item.content || '',
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
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      author_email: item.author_email || '',
      published_at: item.published_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
  }, []);

  const searchNews = useCallback(async (query: string, page: number = 1, limit: number = 20): Promise<NewsItem[]> => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const url = `${API_URL}/api/client/fetch?type=search&q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newsItems = (data.news || []).map(normalizeNewsItem);
      return newsItems;
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [normalizeNewsItem, sessionToken]);

  return {
    searchNews,
    isSearching,
    searchError
  };
};