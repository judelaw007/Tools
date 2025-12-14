'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ModalStep = 'email' | 'sending' | 'code' | 'verifying' | 'success';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
  returnTo?: string;
  prefillEmail?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  toolName,
  returnTo = '/dashboard',
  prefillEmail = '',
}: AuthModalProps) {
  const [step, setStep] = useState<ModalStep>('email');
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState(300);
  const [rememberMe, setRememberMe] = useState(true);
  const [retryAfter, setRetryAfter] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail(prefillEmail);
      setCode(['', '', '', '', '', '']);
      setError('');
      setRememberMe(true);
      setRetryAfter(0);
      // Focus email input after modal opens
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen, prefillEmail]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (step === 'code' && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError('Verification code expired. Please request a new code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, expiresIn]);

  // Retry countdown
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  // Send verification code
  async function sendCode() {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setStep('sending');
    setError('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMaskedEmail(data.maskedEmail);
        setExpiresIn(data.expiresIn || 300);
        setStep('code');
        // Focus first code input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setStep('email');
        setError(data.message || data.error || 'Failed to send verification code');
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
      }
    } catch (err) {
      console.error('Send code error:', err);
      setStep('email');
      setError('Something went wrong. Please try again.');
    }
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === 5 && newCode.every((d) => d)) {
      verifyCode(newCode.join(''));
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      verifyCode(pasted);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify code
  async function verifyCode(codeStr: string) {
    setStep('verifying');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: codeStr,
          returnTo,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        // Redirect after showing success message
        setTimeout(() => {
          window.location.href = returnTo;
        }, 3000);
      } else {
        setStep('code');
        setError(data.error || 'Invalid code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setStep('code');
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
    }
  }

  // Resend code
  async function resendCode() {
    if (retryAfter > 0) return;
    setCode(['', '', '', '', '', '']);
    setError('');
    setStep('sending');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMaskedEmail(data.maskedEmail);
        setExpiresIn(data.expiresIn || 300);
        setStep('code');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setStep('code');
        setError(data.message || data.error || 'Failed to resend code');
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
      }
    } catch (err) {
      setStep('code');
      setError('Something went wrong. Please try again.');
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== 'success' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button (not shown during success) */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-8">
          {/* Email Entry */}
          {step === 'email' && (
            <>
              <div className="w-14 h-14 bg-mojitax-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7 text-mojitax-blue" />
              </div>
              <h2 className="text-xl font-semibold text-mojitax-navy text-center mb-2">
                {toolName ? `Access ${toolName}` : 'Access MojiTax Tools'}
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Enter your mojitax.co.uk email address. We&apos;ll send you a verification code.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-mojitax-blue focus:ring-2 focus:ring-mojitax-blue/20 outline-none transition-all"
                  />
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-mojitax-blue focus:ring-mojitax-blue/20"
                  />
                  <span className="text-sm text-slate-600">
                    Remember me for 30 days
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  onClick={sendCode}
                  disabled={retryAfter > 0}
                >
                  {retryAfter > 0 ? `Wait ${retryAfter}s` : 'Send Verification Code'}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Don&apos;t have an account?{' '}
                  <a href="https://www.mojitax.co.uk" target="_blank" rel="noopener noreferrer" className="text-mojitax-blue hover:underline">
                    Sign up at mojitax.co.uk
                  </a>
                </p>
              </div>
            </>
          )}

          {/* Sending */}
          {step === 'sending' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-mojitax-blue mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Sending Verification Code
              </h2>
              <p className="text-slate-600">Please wait...</p>
            </div>
          )}

          {/* Code Entry */}
          {step === 'code' && (
            <>
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-mojitax-navy transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="w-14 h-14 bg-mojitax-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7 text-mojitax-green" />
              </div>
              <h2 className="text-xl font-semibold text-mojitax-navy text-center mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-600 text-center mb-6">
                We sent a 6-digit code to<br />
                <span className="font-medium text-slate-800">{maskedEmail}</span>
              </p>

              {/* Code inputs */}
              <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-lg focus:border-mojitax-blue focus:ring-2 focus:ring-mojitax-blue/20 outline-none transition-all"
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Timer */}
              <p className="text-sm text-slate-500 text-center mb-4">
                Code expires in{' '}
                <span className={expiresIn < 60 ? 'text-red-600 font-medium' : 'font-medium'}>
                  {formatTime(expiresIn)}
                </span>
              </p>

              {/* Resend */}
              <button
                onClick={resendCode}
                disabled={retryAfter > 0}
                className="w-full text-sm text-mojitax-blue hover:text-mojitax-blue-dark disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {retryAfter > 0
                  ? `Resend code in ${retryAfter}s`
                  : "Didn't receive the code? Resend"}
              </button>
            </>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-mojitax-blue mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Verifying Code
              </h2>
              <p className="text-slate-600">Please wait...</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-mojitax-navy mb-2">
                Access Verified!
              </h2>
              <p className="text-slate-600 mb-6">
                {toolName ? `You now have access to ${toolName}.` : 'You now have access to MojiTax Tools.'}
              </p>

              {/* Important message about direct access */}
              <div className="bg-mojitax-blue/5 border border-mojitax-blue/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-mojitax-navy mb-2">
                  Quick Access Tip
                </p>
                <p className="text-sm text-slate-600">
                  Next time, you can access your tools directly at{' '}
                  <span className="font-medium text-mojitax-blue">tools.mojitax.co.uk</span>
                  {' '}without going through mojitax.co.uk. We&apos;ll remember you!
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to your tool...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
