// frontend/src/components/client/hooks/useArticle.tsx
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';

export interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  featured: boolean;
  image_url: string;
  status: string;
  priority: string;
  tags: string;
  reading_time: number;
  views: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
  first_name: string;
  last_name: string;
  author_email: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface UseArticleReturn {
  trackView: (slug: string) => Promise<void>;
  trackLike: (slug: string, clientId?: string) => Promise<void>;
  isTracking: boolean;
  trackingError: string | null;
}

export const useArticle = (): UseArticleReturn => {
  const { sessionToken, clientId } = useClientSession();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const trackView = useCallback(async (slug: string): Promise<void> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) return;
    
    setIsTracking(true);
    setTrackingError(null);
    
    try {
      const response = await fetch('/api/client/article', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }) 
        },
        body: JSON.stringify({ 
          action: 'view', 
          slug: trimmedSlug, 
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown', 
          ip_address: 'frontend' 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to track view');
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      setTrackingError('Failed to track view');
    } finally {
      setIsTracking(false);
    }
  }, [sessionToken]);

  const trackLike = useCallback(async (slug: string, providedClientId?: string): Promise<void> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) return;
    
    const effectiveClientId = providedClientId || clientId;
    if (!effectiveClientId) return;
    
    setIsTracking(true);
    setTrackingError(null);
    
    try {
      const response = await fetch('/api/client/article', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }) 
        },
        body: JSON.stringify({ 
          action: 'like', 
          slug: trimmedSlug, 
          client_id: effectiveClientId 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to track like');
      }
    } catch (error) {
      console.error('Error tracking like:', error);
      setTrackingError('Failed to track like');
    } finally {
      setIsTracking(false);
    }
  }, [sessionToken, clientId]);

  return {
    trackView,
    trackLike,
    isTracking,
    trackingError
  };
};