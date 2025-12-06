'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { User, Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | null>(null);

  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const handleLogin = async (role: 'user' | 'admin') => {
    setSelectedRole(role);
    await login(role);

    // Use window.location for full page navigation so cookie is sent to middleware
    if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = returnTo;
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Logo className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Welcome to MojiTax Tools</h1>
        <p className="text-slate-600 mt-2">Select a login option to continue</p>
      </div>

      {/* Dev Mode Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Development Mode</p>
          <p className="text-sm text-amber-700 mt-1">
            This is a simplified login for development. Production will use MojiTax LMS authentication.
          </p>
        </div>
      </div>

      {/* Login Options */}
      <div className="space-y-4">
        {/* User Login */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRole === 'user' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => !isLoading && handleLogin('user')}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Login as User</h3>
                <p className="text-sm text-slate-600">Access your enrolled tools and dashboard</p>
                <p className="text-xs text-slate-500 mt-1">user@mojitax.co.uk</p>
              </div>
              <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${
                selectedRole === 'user' && isLoading ? 'animate-pulse' : ''
              }`} />
            </div>
          </div>
        </Card>

        {/* Admin Login */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRole === 'admin' ? 'ring-2 ring-purple-500' : ''
          }`}
          onClick={() => !isLoading && handleLogin('admin')}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Login as Admin</h3>
                <p className="text-sm text-slate-600">Full access to admin dashboard and settings</p>
                <p className="text-xs text-slate-500 mt-1">admin@mojitax.co.uk</p>
              </div>
              <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${
                selectedRole === 'admin' && isLoading ? 'animate-pulse' : ''
              }`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Back to tools link */}
      <div className="text-center mt-8">
        <Button variant="ghost" onClick={() => router.push('/tools')}>
          Back to Public Tools
        </Button>
      </div>
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
