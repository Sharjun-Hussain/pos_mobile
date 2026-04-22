"use client";

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    haptics.medium();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.auth.forgotPassword(email);
      setStatus('success');
      haptics.success();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to send reset link. Please try again.');
      haptics.error();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col justify-center px-6">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <button 
          onClick={() => { haptics.light(); router.back(); }}
          className="h-10 w-10 glass-panel border border-glass-border/40 rounded-full flex items-center justify-center text-text-main mb-6 active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-text-main mb-2">Password<br/>Recovery</h1>
          <p className="text-sm font-bold text-text-secondary">Enter your email to receive instructions.</p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center gap-4 border-emerald-500/20"
            >
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-surface shadow-xl">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-main">Check your Inbox</h3>
                <p className="text-xs font-bold text-text-secondary mt-2">
                  We've sent a secure recovery link to<br/>
                  <span className="text-brand">{email}</span>
                </p>
              </div>
              <button 
                onClick={() => { haptics.light(); router.push('/login'); }}
                className="w-full h-12 mt-4 bg-surface-muted text-text-main font-bold rounded-2xl active:scale-95 transition-all"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {status === 'error' && (
                <div className="glass-panel p-3 rounded-2xl bg-rose-500/5 text-rose-500 flex items-center gap-2 border-rose-500/10">
                  <AlertCircle size={16} />
                  <p className="text-[11px] font-bold">{errorMessage}</p>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                  className="w-full h-16 bg-surface border border-glass-border rounded-2xl pl-12 pr-4 text-[15px] font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/40 shadow-sm"
                />
              </div>

              <button 
                type="submit"
                disabled={status === 'loading' || !email}
                className="btn-primary w-full h-16 text-lg mt-4 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                ) : (
                  'Send Recovery Link'
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
