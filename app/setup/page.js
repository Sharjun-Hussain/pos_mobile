"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Server, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SetupPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Pre-fill with existing if available
    storage.get('custom_api_url').then(saved => {
      if (saved) {
        // Hide the /api/v1 suffix from the user
        const displayUrl = saved.replace(/\/api\/v1\/?$/i, '');
        setUrl(displayUrl);
      }
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    haptics.medium();

    try {
      // Basic validation and protocol enforcement
      let base = url.trim();
      if (!base.startsWith('http')) {
        base = `https://${base}`;
      }

      // Strip any trailing slashes or existing /api/v1 to avoid duplication
      const cleanBase = base.replace(/\/+$/, '').replace(/\/api\/v1\/?$/i, '');

      // Canonical storage URL always ends with /api/v1
      const storageUrl = `${cleanBase}/api/v1`;

      // 1. Test Connection (optional but recommended)
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        await fetch(`${storageUrl}/common/health-check`, { signal: controller.signal });
      } catch (err) {
        // We will allow saving even if test fails
      }
      clearTimeout(id);

      // 2. Save canonical URL to storage
      await storage.set('custom_api_url', storageUrl);
      haptics.heavy();

      // 3. Redirect
      router.push('/login');
    } catch (err) {
      setError('Could not connect to the server. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col justify-center p-8 px-10 bg-surface pt-[var(--sat)] pb-[var(--sab)] overflow-hidden">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-6 mb-12 mt-4">
          <div className="relative h-24 w-24 rounded-3xl overflow-hidden shadow-2xl shadow-brand/20">
            <Image 
              src="/logo.png" 
              alt="Inzeedo Logo" 
              fill
              className="object-cover" 
            />
          </div>
          <div className="text-center px-4">
            <h1 className="text-4xl font-black text-text-main tracking-tight">Server Setup</h1>
            <p className="text-text-secondary text-base font-medium mt-2 leading-relaxed max-w-[320px] mx-auto">
              Configure your self-hosted API endpoint to get started with Inzeedo POS.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6 w-full max-w-sm mx-auto">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary ml-1 opacity-70">Server API URL</label>
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand" size={20} />
              <input
                type="text"
                placeholder="https://pos.yourdomain.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{error}</p>}
          </div>

          <div className="glass-panel p-5 rounded-2xl flex gap-3 items-start border-brand/10 bg-brand/[0.02]">
            <ShieldCheck className="text-brand shrink-0" size={20} />
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Your URL is stored locally on this device. We recommend using <span className="text-text-main font-bold underline decoration-brand/30">HTTPS</span> for a secure connection to your self-hosted backend.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-16 text-lg mt-4 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
            ) : (
              <>Save & Connect <ArrowRight size={20} className="ml-1" /></>
            )}
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-2 text-text-secondary">
          <HelpCircle size={16} />
          <button className="text-base font-bold text-text-secondary/80 hover:text-brand transition-colors active:opacity-50">Where can I find this?</button>
        </div>
      </div>
    </div>
  );
}
