import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { saveApiKey, getApiKey, clearApiKey as clearApiKeyFromStorage } from '../services/apiKeyManager';

interface ApiKeyContextType {
  apiKey: string | null;
  hasApiKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  loading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setApiKeyState(storedKey);
    }
    setLoading(false);
  }, []);

  const setApiKey = useCallback((key: string) => {
    saveApiKey(key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    clearApiKeyFromStorage();
    setApiKeyState(null);
  }, []);

  const value = {
    apiKey,
    hasApiKey: !!apiKey,
    setApiKey,
    clearApiKey,
    loading,
  };

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
