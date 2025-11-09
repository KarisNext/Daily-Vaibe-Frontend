'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeoLocation {
  county: string | null;
  town: string | null;
  category: string;
}

const GEO_STORAGE_KEY = 'vt_geo_location';
const GEO_CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useGeoTracking() {
  const [location, setLocation] = useState<GeoLocation>({ 
    county: null, 
    town: null, 
    category: 'UNKNOWN' 
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetected, setLastDetected] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GEO_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < GEO_CACHE_DURATION) {
          setLocation(parsed.location);
          setLastDetected(parsed.timestamp);
        } else {
          detectLocation();
        }
      } catch (e) {
        detectLocation();
      }
    } else {
      detectLocation();
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    try {
      const response = await fetch('/api/client/geo/current', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.location) {
          setLocation(data.location);
          const timestamp = Date.now();
          setLastDetected(timestamp);
          localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify({
            location: data.location,
            timestamp
          }));
        }
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting]);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(GEO_STORAGE_KEY);
    setLocation({ county: null, town: null, category: 'UNKNOWN' });
    setLastDetected(null);
  }, []);

  return {
    location,
    isDetecting,
    lastDetected,
    detectLocation,
    clearLocation,
  };
}