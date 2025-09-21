import React from 'react';
import type { User } from '@supabase/supabase-js';
import Button from './common/Button';
import LogoIcon from './icons/LogoIcon';

type View = 'landing' | 'login' | 'signup' | 'settings';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: View | 'dashboard') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate }) => {

  const handleLogoClick = () => {
    if (user) {
        onNavigate('dashboard');
    } else {
        onNavigate('landing');
    }
  };
    
  return (
    <header className="bg-secondary/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-800">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
          <LogoIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Rix</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <a onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">Dashboard</a>
              <a onClick={() => onNavigate('settings')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">Settings</a>
              <Button onClick={onLogout} variant="secondary">Logout</Button>
            </>
          ) : (
            <>
              <a onClick={() => onNavigate('login')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">Login</a>
              <Button onClick={() => onNavigate('signup')}>Get Started</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
