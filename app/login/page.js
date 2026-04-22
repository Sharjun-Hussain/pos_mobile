"use client";

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    haptics.medium();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-8 bg-surface">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-bold text-zinc-100 italic tracking-tighter">S-POS</h1>
        <p className="text-zinc-500 font-medium">Welcome back, manager.</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="email" 
              placeholder="name@store.com" 
              required
              className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-zinc-100 outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required
              className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-zinc-100 outline-none focus:border-brand/50 transition-colors"
            />
            <button 
              type="button"
              onClick={() => { setShowPassword(!showPassword); haptics.light(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button type="button" className="text-brand text-sm font-semibold">Forgot Password?</button>
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

      <div className="mt-12 text-center">
        <p className="text-zinc-500 text-sm">
          Don't have an account? 
          <button className="text-brand font-semibold ml-1">Contact Support</button>
        </p>
      </div>
    </div>
  );
}
