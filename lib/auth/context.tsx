'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState, DEV_USERS, UserRole } from './types';

const AUTH_COOKIE_NAME = 'mojitax-dev-auth';

interface AuthContextType extends AuthState {
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedRole = getCookie(AUTH_COOKIE_NAME);
    if (savedRole && (savedRole === 'user' || savedRole === 'admin')) {
      setUser(DEV_USERS[savedRole]);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (role: UserRole) => {
    // Login is handled by API route, just update local state
    const devUser = DEV_USERS[role];
    setUser(devUser);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
