"use client";

import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(token ? 'idle' : 'error');
  const [errorMessage, setErrorMessage] = useState(token ? '' : 'Invalid or missing secure token. Please request a new link.');

  // Security check mapping
  const requirements = [
    { label: 'Minimum 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /[0-9]/.test(password) },
    { label: 'Contains a symbol', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword }
  ];

  const allValid = requirements.every(r => r.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !allValid) return;

    haptics.medium();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.auth.resetPassword(token, password);
      setStatus('success');
      haptics.success();
      
      // Auto redirect after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
      haptics.error();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col justify-center px-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-500/10 blur-[100px] rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="h-24 w-24 rounded-3xl overflow-hidden shadow-2xl shadow-brand/20">
            <img src="/logo.png" alt="Inzeedo Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-main">New Password</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Secure your account with a strong password.</p>
          </div>
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
               <h3 className="text-lg font-black text-text-main">Password Updated</h3>
               <p className="text-xs font-bold text-text-secondary mt-2">
                 Your security key has been successfully changed.<br/>Redirecting to login...
               </p>
             </div>
             <Loader2 size={24} className="animate-spin text-brand mt-4" />
           </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {status === 'error' && (
                <div className="glass-panel p-3 rounded-2xl bg-rose-500/5 text-rose-500 flex items-start gap-3 border-rose-500/10 mb-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold">{errorMessage}</p>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  disabled={!token}
                  className="w-full h-14 bg-surface border border-glass-border rounded-2xl pl-12 pr-12 text-[15px] font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/40 shadow-sm disabled:opacity-50"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary active:scale-90 transition-transform"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  disabled={!token}
                  className="w-full h-14 bg-surface border border-glass-border rounded-2xl pl-12 pr-4 text-[15px] font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/40 shadow-sm disabled:opacity-50"
                />
              </div>

              {/* Requirement Checklist */}
              <div className="glass-panel p-4 rounded-3xl mt-2 flex flex-col gap-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${req.valid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-surface-muted text-text-secondary/40'}`}>
                      <CheckCircle2 size={10} strokeWidth={3} />
                    </div>
                    <span className={`text-[11px] font-bold transition-colors ${req.valid ? 'text-emerald-500 dark:text-emerald-400' : 'text-text-secondary/70'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                disabled={status === 'loading' || !allValid || !token}
                className="btn-primary w-full h-16 text-lg mt-4 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
