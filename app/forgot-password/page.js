"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import Image from 'next/image';

// Memoized Header for branding synchronization
const RecoveryHeader = memo(() => (
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
      <h1 className="text-2xl font-bold text-text-main tracking-tight">Recovery</h1>
      <p className="text-text-secondary text-sm font-medium mt-2 leading-relaxed max-w-[320px] mx-auto">
        Enter your email to receive secure recovery instructions.
      </p>
    </div>
  </div>
));
RecoveryHeader.displayName = 'RecoveryHeader';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email) return;

    haptics.medium();
    setErrorMessage('');

    startTransition(async () => {
      try {
        await api.auth.forgotPassword(email);
        setIsSuccess(true);
        haptics.heavy();
      } catch (err) {
        setErrorMessage(err.message || 'Failed to send recovery link. Please verify your email.');
        haptics.error();
      }
    });
  }, [email]);

  return (
    <div className="h-[100dvh] relative overflow-hidden bg-surface flex flex-col justify-center px-8 pt-[var(--sat)] pb-[var(--sab)]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button 
          onClick={handleBack}
          className="h-10 w-10 glass-panel border border-glass-border/40 rounded-full flex items-center justify-center text-text-main mb-6 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>

        {isSuccess ? (
          <div className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center gap-6 border-brand/5 shadow-2xl shadow-brand/5 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center shadow-lg">
              <CheckCircle2 size={40} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-main">Check your Inbox</h3>
              <p className="text-sm font-medium text-text-secondary mt-3 leading-relaxed">
                We've sent a secure recovery link to<br/>
                <span className="text-brand font-bold">{email}</span>
              </p>
            </div>
            <button 
              onClick={() => { haptics.light(); router.push('/login'); }}
              className="w-full h-14 bg-surface-muted text-text-main font-bold rounded-2xl active:opacity-50 transition-opacity"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            <RecoveryHeader />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-semibold animate-in fade-in zoom-in duration-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary ml-1 opacity-80">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    required
                    disabled={isPending}
                    className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-70 shadow-sm"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPending || !email}
                className="btn-primary w-full h-16 text-base font-semibold mt-4 disabled:opacity-50"
              >
                {isPending ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                ) : (
                  'Send Recovery Link'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
