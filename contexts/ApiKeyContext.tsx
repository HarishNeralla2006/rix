import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  hasApiKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  loading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // The application now uses a public API (Pollinations.ai) and does not require a user-provided key.
  // This context provider is simplified to always report that an "API key" is present.
  const [apiKey] = useState<string | null>('pollinations-ai-enabled');
  const [loading] = useState(false);

  const setApiKey = useCallback((_key: string) => {
    // This function is now a no-op as the API is public.
    console.warn("setApiKey is deprecated. Rix now uses a public API.");
  }, []);

  const clearApiKey = useCallback(() => {
    // This function is now a no-op.
    console.warn("clearApiKey is deprecated. Rix now uses a public API.");
  }, []);

  const value = {
    apiKey,
    hasApiKey: true, // Always true
    setApiKey,
    clearApiKey,
    loading, // Always false
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
