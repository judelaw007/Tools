'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Shield, Loader2, Lock, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Admin Login Page
 *
 * Secure admin login using Supabase Auth.
 * Admins must be registered in the admin_users table.
 * URL: /auth/admin
 */
function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const returnTo = searchParams.get('returnTo') || '/admin';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.redirectTo || returnTo;
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
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
          <Logo className="h-10 mx-auto mb-4" showText={false} />
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

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mojitax.co.uk"
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-purple-600 hover:bg-purple-700"
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
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
