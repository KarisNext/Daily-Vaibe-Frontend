// frontend/src/components/client/hooks/useHome.tsx
'use client';

import { useCallback } from 'react';

interface UseHomeReturn {
  refreshHomeData: () => Promise<void>;
}

export const useHome = (): UseHomeReturn => {
  const refreshHomeData = useCallback(async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to refresh home data:', err);
    }
  }, []);

  return {
    refreshHomeData
  };
};