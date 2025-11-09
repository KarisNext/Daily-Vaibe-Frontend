// frontend/src/hooks/useCookies.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_PREFERENCES_KEY = 'vt_cookie_preferences';
const COOKIE_CONSENT_KEY = 'vt_cookie_consent';

export function useCookies() {
  const [showBanner, setShowBanner] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (stored) {
        try {
          setPreferences(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse cookie preferences', e);
        }
      }
    }
  }, []);

  const acceptAll = useCallback(() => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(newPrefs);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPrefs));
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  }, []);

  const rejectAll = useCallback(() => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(newPrefs);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPrefs));
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  }, []);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPrefs));
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowManageModal(false);
  }, []);

  const openManageModal = useCallback(() => {
    setShowManageModal(true);
  }, []);

  const closeManageModal = useCallback(() => {
    setShowManageModal(false);
  }, []);

  return {
    showBanner,
    showManageModal,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences,
    openManageModal,
    closeManageModal,
  };
}