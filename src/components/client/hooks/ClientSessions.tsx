// frontend/src/components/ClientSessions.tsx

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';

interface ClientSessionData {
  success: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: null;
  client_id: string | null;
  csrf_token: string | null;
  message: string | null;
}

interface ClientSessionContextType {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  clientId: string | null;
  csrfToken: string | null;
  error: string | null;
  sessionToken: string | null;
  createSession: () => Promise<void>;
}

const ClientSessionContext = createContext<ClientSessionContextType | undefined>(undefined);

export const useClientSession = () => {
  const context = useContext(ClientSessionContext);
  if (!context) {
    throw new Error('useClientSession must be used within a ClientSessionProvider');
  }
  return context;
};

export const ClientSessionProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const stored = localStorage.getItem('vt_session_initialized');
      if (!stored) {
        setIsAnonymous(true);
        setIsAuthenticated(false);
      }
    }
  }, []);

  const createSession = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/client/auth/anonymous', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data: ClientSessionData = await response.json();
        setClientId(data.client_id || null);
        setCsrfToken(data.csrf_token || null);
        setIsAuthenticated(data.isAuthenticated);
        setIsAnonymous(data.isAnonymous);
        localStorage.setItem('vt_session_initialized', 'true');
      } else {
        setError(`Failed to create session: ${response.status}`);
      }
    } catch (err) {
      setError('Network error during session creation');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const value: ClientSessionContextType = {
    isAuthenticated,
    isAnonymous,
    isLoading,
    clientId,
    csrfToken,
    error,
    sessionToken: csrfToken,
    createSession,
  };

  return (
    <ClientSessionContext.Provider value={value}>
      {children}
    </ClientSessionContext.Provider>
  );
};