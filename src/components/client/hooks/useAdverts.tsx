'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Advert {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  link?: string;
  position: 'top' | 'bottom' | 'sidebar' | 'inline';
  priority: number;
  targetAudience?: string[];
  startDate?: string;
  endDate?: string;
  clickCount: number;
  impressionCount: number;
  active: boolean;
}

interface AdvertResponse {
  success: boolean;
  topAds: Advert[];
  bottomAds: Advert[];
  sidebarAds: Advert[];
  inlineAds: Advert[];
  totalAds: number;
  message?: string;
}

interface UseAdvertsReturn {
  topAds: Advert[];
  bottomAds: Advert[];
  sidebarAds: Advert[];
  inlineAds: Advert[];
  allAds: Advert[];
  isLoading: boolean;
  error: string | null;
  refreshAds: () => Promise<void>;
  trackImpression: (adId: string) => Promise<void>;
  trackClick: (adId: string) => Promise<void>;
}

export function useAdverts(): UseAdvertsReturn {
  const [topAds, setTopAds] = useState<Advert[]>([]);
  const [bottomAds, setBottomAds] = useState<Advert[]>([]);
  const [sidebarAds, setSidebarAds] = useState<Advert[]>([]);
  const [inlineAds, setInlineAds] = useState<Advert[]>([]);
  const [allAds, setAllAds] = useState<Advert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get session data for personalization
  const getSessionData = useCallback(() => {
    try {
      const sessionData = {
        userId: localStorage.getItem('userId') || null,
        sessionId: localStorage.getItem('sessionId') || generateSessionId(),
        userPreferences: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
        location: localStorage.getItem('userLocation') || 'KE',
        deviceType: getDeviceType(),
        language: navigator.language || 'en',
        timestamp: new Date().toISOString(),
      };

      // Store session ID if new
      if (!localStorage.getItem('sessionId')) {
        localStorage.setItem('sessionId', sessionData.sessionId);
      }

      return sessionData;
    } catch (err) {
      console.error('Error getting session data:', err);
      return {
        sessionId: generateSessionId(),
        deviceType: getDeviceType(),
        language: 'en',
        location: 'KE',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  // Generate unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Detect device type
  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Fetch advertisements from API
  const fetchAds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionData = getSessionData();
      
      const response = await fetch('/api/adverts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionData,
          requestedPositions: ['top', 'bottom', 'sidebar', 'inline'],
          limit: {
            top: 12,
            bottom: 10,
            sidebar: 5,
            inline: 8,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ads: ${response.statusText}`);
      }

      const data: AdvertResponse = await response.json();

      if (data.success) {
        // Filter active ads and sort by priority
        const filterAndSort = (ads: Advert[]) => 
          ads
            .filter(ad => ad.active && isAdValid(ad))
            .sort((a, b) => b.priority - a.priority);

        setTopAds(filterAndSort(data.topAds || []));
        setBottomAds(filterAndSort(data.bottomAds || []));
        setSidebarAds(filterAndSort(data.sidebarAds || []));
        setInlineAds(filterAndSort(data.inlineAds || []));
        
        const all = [
          ...(data.topAds || []),
          ...(data.bottomAds || []),
          ...(data.sidebarAds || []),
          ...(data.inlineAds || []),
        ];
        setAllAds(filterAndSort(all));
      } else {
        setError(data.message || 'Failed to load advertisements');
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load advertisements');
      
      // Set empty arrays on error
      setTopAds([]);
      setBottomAds([]);
      setSidebarAds([]);
      setInlineAds([]);
      setAllAds([]);
    } finally {
      setIsLoading(false);
    }
  }, [getSessionData]);

  // Check if ad is valid (not expired)
  const isAdValid = (ad: Advert): boolean => {
    const now = new Date();
    
    if (ad.startDate && new Date(ad.startDate) > now) {
      return false;
    }
    
    if (ad.endDate && new Date(ad.endDate) < now) {
      return false;
    }
    
    return true;
  };

  // Track ad impression
  const trackImpression = useCallback(async (adId: string) => {
    try {
      const sessionData = getSessionData();
      
      await fetch('/api/adverts/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adId,
          type: 'impression',
          sessionData,
          timestamp: new Date().toISOString(),
        }),
      });

      // Update local state
      const updateAdStats = (ads: Advert[]) =>
        ads.map(ad =>
          ad.id === adId
            ? { ...ad, impressionCount: ad.impressionCount + 1 }
            : ad
        );

      setTopAds(prev => updateAdStats(prev));
      setBottomAds(prev => updateAdStats(prev));
      setSidebarAds(prev => updateAdStats(prev));
      setInlineAds(prev => updateAdStats(prev));
      setAllAds(prev => updateAdStats(prev));
    } catch (err) {
      console.error('Error tracking impression:', err);
    }
  }, [getSessionData]);

  // Track ad click
  const trackClick = useCallback(async (adId: string) => {
    try {
      const sessionData = getSessionData();
      
      await fetch('/api/adverts/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adId,
          type: 'click',
          sessionData,
          timestamp: new Date().toISOString(),
        }),
      });

      // Update local state
      const updateAdStats = (ads: Advert[]) =>
        ads.map(ad =>
          ad.id === adId
            ? { ...ad, clickCount: ad.clickCount + 1 }
            : ad
        );

      setTopAds(prev => updateAdStats(prev));
      setBottomAds(prev => updateAdStats(prev));
      setSidebarAds(prev => updateAdStats(prev));
      setInlineAds(prev => updateAdStats(prev));
      setAllAds(prev => updateAdStats(prev));

      // Open ad link if available
      const ad = allAds.find(a => a.id === adId);
      if (ad?.link) {
        window.open(ad.link, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  }, [getSessionData, allAds]);

  // Refresh ads manually
  const refreshAds = useCallback(async () => {
    await fetchAds();
  }, [fetchAds]);

  // Fetch ads on mount
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Refresh ads periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAds();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchAds]);

  // Track impressions when ads are visible
  useEffect(() => {
    if (!isLoading && allAds.length > 0) {
      const impressionTimeout = setTimeout(() => {
        allAds.forEach(ad => {
          trackImpression(ad.id);
        });
      }, 1000); // Wait 1 second before tracking impression

      return () => clearTimeout(impressionTimeout);
    }
  }, [allAds, isLoading, trackImpression]);

  return {
    topAds,
    bottomAds,
    sidebarAds,
    inlineAds,
    allAds,
    isLoading,
    error,
    refreshAds,
    trackImpression,
    trackClick,
  };
}

// Optional: Export helper function to get ads by position
export function getAdsByPosition(ads: Advert[], position: Advert['position']): Advert[] {
  return ads.filter(ad => ad.position === position && ad.active);
}

// Optional: Export helper function to get random ads
export function getRandomAds(ads: Advert[], count: number): Advert[] {
  const shuffled = [...ads].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Optional: Export helper to calculate ad performance
export function calculateAdPerformance(ad: Advert): number {
  if (ad.impressionCount === 0) return 0;
  return (ad.clickCount / ad.impressionCount) * 100; // CTR percentage
}