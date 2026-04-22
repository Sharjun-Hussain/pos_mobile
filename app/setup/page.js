"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Server, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Pre-fill with existing if available
    storage.get('custom_api_url').then(saved => {
      if (saved) setUrl(saved);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    haptics.medium();

    try {
      // Basic validation
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // Remove trailing slash
      if (formattedUrl.endsWith('/')) {
        formattedUrl = formattedUrl.slice(0, -1);
      }

      // 1. Test Connection (optional but recommended)
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch(`${formattedUrl}/common/health-check`, { signal: controller.signal });
        // Even if 404, we check if the host exists. 
        // In this project, let's just assume if fetch doesn't throw, host is alive.
      } catch (err) {
        // console.error('Connection test failed', err);
        // We will allow saving even if test fails, but warn. 
        // For strictness, you could throw here.
      }
      clearTimeout(id);

      // 2. Save
      await storage.set('custom_api_url', formattedUrl);
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
    <div className="min-h-screen flex flex-col justify-center p-8 bg-surface">
      <div className="flex flex-col gap-2 mb-12">
        <div className="p-3 w-fit rounded-2xl bg-brand/10 text-brand mb-4">
          <Server size={32} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Server Setup</h1>
        <p className="text-zinc-500 font-medium leading-relaxed">
          Configure your self-hosted API endpoint to get started with Inzeedo POS.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">Server API URL</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              placeholder="https://pos.yourdomain.com/api/v1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-zinc-100 outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/5 flex gap-3 items-start">
          <ShieldCheck className="text-brand shrink-0" size={20} />
          <p className="text-[11px] text-zinc-500 leading-normal">
            Your URL is stored locally on this device. We recommend using <span className="text-zinc-300 font-semibold">HTTPS</span> for a secure connection to your self-hosted backend.
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
            <>Save & Connect <ArrowRight size={20} /></>
          )}
        </button>
      </form>

      <div className="mt-12 flex items-center justify-center gap-2 text-zinc-500">
        <HelpCircle size={16} />
        <button className="text-sm font-medium hover:text-zinc-300">Where can I find this?</button>
      </div>
    </div>
  );
}
