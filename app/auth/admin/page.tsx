'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Shield, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Hidden Admin Login Page
 *
 * This page is not linked anywhere - admins access it directly via URL.
 * URL: /auth/admin
 */
export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = searchParams.get('returnTo') || '/admin';

  const handleAdminLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', returnTo }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectTo;
      } else {
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="h-10 mx-auto mb-4" variant="light" />
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Administrator Access</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Admin Login</h2>
                <p className="text-sm text-slate-400">Platform management access</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleAdminLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign in as Administrator
                </>
              )}
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
