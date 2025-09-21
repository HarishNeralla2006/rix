import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { Session, User, AuthError, SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  logIn: (credentials: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Error getting session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
    }
    
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (loading) setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loading]);

  const value = {
    user,
    session,
    loading,
    isSupabaseConfigured,
    signUp: (credentials: SignUpWithPasswordCredentials) => supabase.auth.signUp(credentials),
    logIn: (credentials: SignInWithPasswordCredentials) => supabase.auth.signInWithPassword(credentials),
    logout: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
