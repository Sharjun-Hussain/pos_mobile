"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import Image from 'next/image';

// Memoized Header for synchronization with Setup page
const LoginHeader = memo(() => (
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
      <h1 className="text-2xl font-bold text-text-main tracking-tight">
        {process.env.NEXT_PUBLIC_APP_NAME || "Inzeedo POS"}
      </h1>
      <p className="text-text-secondary text-sm font-medium mt-2 leading-relaxed">
        Professional Point of Sale System
      </p>
    </div>
  </div>
));
LoginHeader.displayName = 'LoginHeader';

// Memoized Footer Section
const LoginFooter = memo(({ onSetupClick }) => (
  <div className="mt-12 text-center flex flex-col gap-5">
    <p className="text-text-secondary text-sm font-medium">
      Don't have an account? 
      <button className="text-brand font-bold ml-1 active:opacity-50">Contact Support</button>
    </p>
    <button 
      onClick={onSetupClick}
      className="text-text-secondary text-xs font-semibold hover:text-brand transition-colors active:opacity-50 flex items-center justify-center gap-1 mx-auto"
    >
      Using a different server? <span className="underline decoration-brand/30">Change Settings</span>
    </button>
  </div>
));
LoginFooter.displayName = 'LoginFooter';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    haptics.medium();

    startTransition(async () => {
      try {
        const res = await api.auth.login(email, password);
        
        if (res.status === 'success') {
          haptics.heavy();
          router.replace('/'); // Use replace for better navigation experience
        } else {
          setError(res.message || 'Invalid login credentials');
        }
      } catch (err) {
        setError(err.message || 'Connection failed. Please verify your server settings.');
      }
    });
  }, [email, password, router]);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
    haptics.light();
  }, []);

  const navigateToSetup = useCallback(() => {
    haptics.light();
    router.push('/setup');
  }, [router]);

  return (
    <div className="h-[100dvh] flex flex-col justify-center p-8 px-10 bg-surface pt-[var(--sat)] pb-[var(--sab)] overflow-hidden">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <LoginHeader />

        <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-sm mx-auto">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-secondary ml-1 opacity-80">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
              <input 
                type="email" 
                placeholder="name@store.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-70"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-semibold text-text-secondary opacity-80">Password</label>
              <button 
                type="button" 
                onClick={() => { haptics.light(); router.push('/forgot-password'); }}
                className="text-brand text-xs font-bold active:opacity-50 transition-opacity"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-base font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-70"
              />
              <button 
                type="button"
                onClick={togglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary active:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-semibold animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="btn-primary w-full h-16 text-base font-semibold mt-4 disabled:opacity-50"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
            ) : (
              <>Sign In <ArrowRight size={20} className="ml-1" /></>
            )}
          </button>
        </form>

        <LoginFooter onSetupClick={navigateToSetup} />
      </div>
    </div>
  );
}
