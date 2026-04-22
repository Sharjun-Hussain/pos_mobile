"use client";

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    haptics.medium();

    try {
      const res = await api.auth.login(email, password);
      
      if (res.status === 'success') {
        haptics.heavy();
        router.push('/');
      } else {
        setError(res.message || 'Invalid login credentials');
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Please check your server URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-8 bg-surface pt-[calc(var(--sat)+2rem)]">
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-xl shadow-brand/10 border border-glass-border">
          <img src="/logo.png" alt="Inzeedo Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-main">
            {process.env.NEXT_PUBLIC_APP_NAME || "Inzeedo POS"}
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">Professional POS System</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-secondary ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input 
              type="email" 
              placeholder="name@store.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-text-main outline-none focus:border-brand/50 transition-colors placeholder:text-text-secondary/50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-secondary ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-text-main outline-none focus:border-brand/50 transition-colors placeholder:text-text-secondary/50"
            />
            <button 
              type="button"
              onClick={() => { setShowPassword(!showPassword); haptics.light(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex justify-end mt-1">
          <button 
            type="button" 
            onClick={() => { haptics.light(); router.push('/forgot-password'); }}
            className="text-brand text-sm font-bold active:opacity-50 transition-opacity"
          >
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full h-16 text-lg mt-4 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
          ) : (
            <>Sign In <ArrowRight size={20} /></>
          )}
        </button>
      </form>

      <div className="mt-12 text-center flex flex-col gap-4">
        <p className="text-text-secondary text-sm font-medium">
          Don't have an account? 
          <button className="text-brand font-bold ml-1">Contact Support</button>
        </p>
        <button 
          onClick={() => { haptics.light(); router.push('/setup'); }}
          className="text-text-secondary text-xs hover:text-brand transition-colors"
        >
          Using a different server? <span className="underline">Change Settings</span>
        </button>
      </div>
    </div>
  );
}
