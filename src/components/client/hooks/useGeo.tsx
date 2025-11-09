// frontend/src/hooks/useGeo.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeoLocation {
  county: string | null;
  town: string | null;
  category?: string;
}

const GEO_STORAGE_KEY = 'vt_geo_location';

export function useGeo() {
  const [location, setLocation] = useState<GeoLocation>({ county: null, town: null });
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(GEO_STORAGE_KEY);
    if (stored) {
      try {
        setLocation(JSON.parse(stored));
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
      const response = await fetch('/api/client/geo?action=current', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.location) {
          setLocation(data.location);
          localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(data.location));
        }
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting]);

  const updateLocation = useCallback(async (newLocation: Partial<GeoLocation>) => {
    try {
      const response = await fetch('/api/client/geo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          ...newLocation
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.location) {
          setLocation(data.location);
          localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(data.location));
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, []);

  return {
    location,
    isDetecting,
    detectLocation,
    updateLocation,
  };
}