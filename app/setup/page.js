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

      // Ensure mandatory /api/v1 suffix
      if (!formattedUrl.toLowerCase().endsWith('/api/v1')) {
        formattedUrl = `${formattedUrl}/api/v1`;
      }

      // 1. Test Connection (optional but recommended)
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        await fetch(`${formattedUrl}/common/health-check`, { signal: controller.signal });
      } catch (err) {
        // We will allow saving even if test fails
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
      <div className="flex flex-col items-center gap-6 mb-12 mt-4">
        <div className="h-24 w-24 rounded-3xl overflow-hidden shadow-2xl shadow-brand/20">
          <img src="/logo.png" alt="Inzeedo Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-center px-4">
          <h1 className="text-4xl font-extrabold text-text-main">Server Setup</h1>
          <p className="text-text-secondary text-base font-medium mt-1 leading-relaxed">
            Configure your self-hosted API endpoint to get started with Inzeedo POS.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-secondary ml-1">Server API URL</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="https://pos.yourdomain.com/api/v1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full h-16 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/50 transition-colors placeholder:text-text-secondary/50"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
        </div>

        <div className="glass-panel p-4 rounded-2xl flex gap-3 items-start">
          <ShieldCheck className="text-brand shrink-0" size={20} />
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            Your URL is stored locally on this device. We recommend using <span className="text-text-main font-semibold">HTTPS</span> for a secure connection to your self-hosted backend.
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

      <div className="mt-12 flex items-center justify-center gap-2 text-text-secondary">
        <HelpCircle size={16} />
        <button className="text-base font-semibold hover:text-brand transition-colors">Where can I find this?</button>
      </div>
    </div>
  );
}
