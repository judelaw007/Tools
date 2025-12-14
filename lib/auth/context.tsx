'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState } from './types';

const SESSION_COOKIE_NAME = 'mojitax-session';

interface AuthContextType extends AuthState {
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

/**
 * Parse the mojitax-session cookie to get user info
 */
function parseSessionCookie(): User | null {
  const sessionCookie = getCookie(SESSION_COOKIE_NAME);
  if (!sessionCookie) return null;

  try {
    const decoded = atob(sessionCookie);
    const session = JSON.parse(decoded);

    if (session.email) {
      return {
        id: session.learnworldsId || session.email,
        name: session.learnworldsUser?.username || session.email.split('@')[0],
        email: session.email,
        role: session.role || 'user',
      };
    }
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const sessionUser = parseSessionCookie();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setIsLoading(false);
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
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
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
