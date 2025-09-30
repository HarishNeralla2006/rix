import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiKeyProvider, useApiKey } from './contexts/ApiKeyContext';
import Header from './components/Header';
import DashboardPage from './components/pages/DashboardPage';
import LoginPage from './components/pages/LoginPage';
import SignUpPage from './components/pages/SignUpPage';
import LandingPage from './components/pages/LandingPage';
import SettingsPage from './components/pages/SettingsPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ApiKeySetupPage from './components/pages/ApiKeySetupPage';

type View = 'landing' | 'login' | 'signup' | 'settings';

const ConfigWarningBanner: React.FC = () => (
    <div className="bg-yellow-500 text-black text-center p-2 text-sm font-semibold">
        Demo Mode: Authentication is disabled. Please configure Supabase credentials to enable full functionality.
    </div>
);

const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout, isSupabaseConfigured } = useAuth();
  const { hasApiKey, loading: apiKeyLoading } = useApiKey();
  const [view, setView] = useState<View | 'dashboard'>('dashboard');
  const [dashboardKey, setDashboardKey] = useState(Date.now());

  const handleNavigate = (targetView: View | 'dashboard') => {
    if (targetView === 'dashboard') {
      // Force re-mount of dashboard to reset its internal state (e.g., show wizard again)
      setDashboardKey(Date.now());
    }
    setView(targetView);
  };

  const renderContent = () => {
    if (authLoading || apiKeyLoading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <LoadingSpinner />
        </div>
      );
    }

    if (user) {
        if (!hasApiKey) {
            return <ApiKeySetupPage />;
        }
        if (view === 'settings') {
            return <SettingsPage onNavigate={handleNavigate} />;
        }
      return <DashboardPage key={dashboardKey} onNavigate={handleNavigate} />;
    }

    switch (view) {
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUpPage onNavigate={handleNavigate} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };
  
  // Decide initial view based on user state
  React.useEffect(() => {
    if (!authLoading) {
      setView(user ? 'dashboard' : 'landing');
    }
  }, [user, authLoading]);


  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {!isSupabaseConfigured && <ConfigWarningBanner />}
      <Header user={user} onLogout={logout} onNavigate={handleNavigate} />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {renderContent()}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Rix &copy; 2024. All rights reserved.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ApiKeyProvider>
        <AppContent />
    </ApiKeyProvider>
  </AuthProvider>
);

export default App;
