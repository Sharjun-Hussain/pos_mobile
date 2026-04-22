"use client";

import React, { useState, useCallback, useTransition, memo, Suspense } from 'react';
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import Image from 'next/image';

// Memoized Header for branding synchronization
const ResetHeader = memo(() => (
  <div className="flex flex-col items-center gap-6 mb-12 mt-4">
    <div className="relative h-24 w-24 rounded-3xl overflow-hidden shadow-2xl shadow-brand/20">
      <Image 
        src="/logo.png" 
        alt="Inzeedo Logo" 
        fill
        priority
        className="object-cover" 
      />
    </div>
    <div className="text-center px-4">
      <h1 className="text-2xl font-bold text-text-main tracking-tight">New Key</h1>
      <p className="text-text-secondary text-sm font-medium mt-2 leading-relaxed max-w-[320px] mx-auto">
        Secure your account with a strong and reliable password.
      </p>
    </div>
  </div>
));
ResetHeader.displayName = 'ResetHeader';

// Memoized Requirement Checklist
const ResetRequirements = memo(({ requirements }) => (
  <div className="glass-panel p-5 rounded-[2rem] mt-4 flex flex-col gap-3 border-brand/5 shadow-sm">
    {requirements.map((req, idx) => (
      <div key={idx} className="flex items-center gap-3">
        <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 ${req.valid ? 'bg-emerald-500/20 text-emerald-500 scale-110 shadow-sm shadow-emerald-500/10' : 'bg-surface-muted text-text-secondary/30'}`}>
          <CheckCircle2 size={12} strokeWidth={3} />
        </div>
        <span className={`text-[12px] font-bold transition-colors duration-300 ${req.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary/60'}`}>
          {req.label}
        </span>
      </div>
    ))}
  </div>
));
ResetRequirements.displayName = 'ResetRequirements';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(token ? 'idle' : 'error');
  const [errorMessage, setErrorMessage] = useState(token ? '' : 'Invalid or expired secure token. Please request a new link.');
  const [isPending, startTransition] = useTransition();

  const requirements = [
    { label: 'Minimum 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /[0-9]/.test(password) },
    { label: 'Contains a symbol', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword }
  ];

  const allValid = requirements.every(r => r.valid);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!token || !allValid) return;

    haptics.medium();
    startTransition(async () => {
      try {
        await api.auth.resetPassword(token, password);
        setStatus('success');
        haptics.heavy();
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
        haptics.error();
      }
    });
  }, [token, password, allValid, router]);

  if (status === 'success') {
    return (
      <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-6 border-brand/5 shadow-2xl shadow-brand/10 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center shadow-lg">
          <CheckCircle2 size={40} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-main">Access Restored</h3>
          <p className="text-sm font-medium text-text-secondary mt-3 leading-relaxed">
            Your security key has been updated.<br/>Redirecting to login...
          </p>
        </div>
        <Loader2 size={24} className="animate-spin text-brand mt-2" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-semibold flex items-center gap-3 mb-2 animate-in fade-in zoom-in duration-300">
          <AlertCircle size={18} className="shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
        <input 
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New Password"
          required
          disabled={!token || isPending}
          className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-base font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-50"
        />
        <button 
          type="button"
          onClick={() => { setShowPassword(!showPassword); haptics.light(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary active:opacity-50"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
        <input 
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
          disabled={!token || isPending}
          className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-50"
        />
      </div>

      <ResetRequirements requirements={requirements} />

      <button 
        type="submit"
        disabled={isPending || !allValid || !token}
        className="btn-primary w-full h-16 text-base font-semibold mt-4 disabled:opacity-50"
      >
        {isPending ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="h-[100dvh] relative overflow-hidden bg-surface flex flex-col justify-center px-8 pt-[var(--sat)] pb-[var(--sab)] text-selection-none">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-500/10 blur-[100px] rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <ResetHeader />
        
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
