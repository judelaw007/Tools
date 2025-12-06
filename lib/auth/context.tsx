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

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
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
    setIsLoading(true);
    // Simulate async login
    await new Promise(resolve => setTimeout(resolve, 300));
    const devUser = DEV_USERS[role];
    setCookie(AUTH_COOKIE_NAME, role);
    setUser(devUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    deleteCookie(AUTH_COOKIE_NAME);
    setUser(null);
    setIsLoading(false);
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
