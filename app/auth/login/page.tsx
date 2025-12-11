'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { GraduationCap, Shield, ArrowRight, Lock, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'sso' | 'admin' | null>(null);

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const ssoError = searchParams.get('sso_error');

  // Handle LearnWorlds SSO login
  const handleSSOLogin = () => {
    setSelectedOption('sso');
    setIsLoading(true);
    // Redirect to LearnWorlds SSO endpoint
    window.location.href = `/api/auth/learnworlds/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  // Handle Admin login (dev mode)
  const handleAdminLogin = async () => {
    setSelectedOption('admin');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', returnTo }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectTo;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setSelectedOption(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Logo className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">MojiTax Tools Platform</h1>
        <p className="text-slate-600 mt-2">Sign in to access your tax tools</p>
      </div>

      {/* SSO Error Message */}
      {ssoError === 'not_configured' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">SSO Setup Required</p>
            <p className="text-sm text-amber-700 mt-1">
              Single Sign-On with MojiTax Learning requires additional configuration.
              Please contact the administrator or use the Admin login for now.
            </p>
          </div>
        </div>
      )}

      {/* Platform Notice */}
      {!ssoError && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">Secure Platform</p>
            <p className="text-sm text-slate-600 mt-1">
              This platform is exclusively for MojiTax course members. Sign in with your MojiTax Learning account to access your tools.
            </p>
          </div>
        </div>
      )}

      {/* Login Options */}
      <div className="space-y-4">
        {/* LearnWorlds SSO Login - Primary */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedOption === 'sso' ? 'border-mojitax-green ring-2 ring-mojitax-green/20' : 'border-mojitax-green/50 hover:border-mojitax-green'
          }`}
          onClick={() => !isLoading && handleSSOLogin()}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-mojitax-green/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-mojitax-green" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">MojiTax Learning Member</h3>
                <p className="text-sm text-slate-600">Sign in via mojitax.co.uk</p>
                <p className="text-xs text-mojitax-green mt-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Redirects to MojiTax Learning
                </p>
              </div>
              {selectedOption === 'sso' && isLoading ? (
                <Loader2 className="w-5 h-5 text-mojitax-green animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-mojitax-green" />
              )}
            </div>
          </div>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500">or</span>
          </div>
        </div>

        {/* Admin Login - Secondary */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedOption === 'admin' ? 'ring-2 ring-purple-500' : ''
          }`}
          onClick={() => !isLoading && handleAdminLogin()}
        >
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Administrator Login</h3>
                <p className="text-xs text-slate-500">Platform management access</p>
              </div>
              {selectedOption === 'admin' && isLoading ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-slate-500 mt-6">
        Don&apos;t have access?{' '}
        <a
          href="https://www.mojitax.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-mojitax-green hover:underline"
        >
          Enroll in a MojiTax course
        </a>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
