"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ChevronRight, Building2, LogOut, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

export default function BranchSelectionPage() {
  const router = useRouter();
  const { user, setSelectedBranch, logout } = useAuthStore();
  const [search, setSearch] = useState('');

  // Protect route
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const branches = user.branches || [];
  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.code && b.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (branch) => {
    haptics.heavy();
    setSelectedBranch(branch);
    router.push('/');
  };

  const handleLogout = () => {
    haptics.medium();
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-white p-6 pb-24 flex flex-col gap-6">
      {/* Header Area */}
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center text-brand bg-brand/10 rounded-xl flex-shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-text-main leading-none mb-1">Select Branch</h1>
            <p className="text-[10px] font-bold text-text-secondary leading-none opacity-40 uppercase tracking-wider">
              {user.organization?.name || 'Inzeedo POS'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-rose-500 active:scale-95 transition-transform hover:bg-rose-50 bg-white"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Search Bar - Clean Style */}
      <section>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-text-main outline-none focus:border-brand/40 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </section>

      {/* Branch List - Clean Listing Style */}
      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100 pb-2">
          <h2 className="text-[10px] font-black text-text-secondary opacity-30 uppercase tracking-[0.1em]">
            Available Locations
          </h2>
        </div>

        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredBranches.map((branch, idx) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleSelect(branch)}
                className="flex items-center justify-between py-3.5 border-b border-slate-100 px-1 active:bg-brand/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-100 group-hover:text-brand group-hover:bg-brand/10 transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-text-main text-[13px] truncate leading-tight">
                        {branch.name}
                      </h4>
                      {branch.code && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                          {branch.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-text-secondary opacity-60 truncate">
                      {branch.address || 'Standard Location'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-brand transition-colors ml-3" />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredBranches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Building2 size={40} strokeWidth={1} />
              <p className="text-[11px] font-bold mt-4">No matching locations</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Meta */}
      <div className="mt-auto py-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
          <div className="h-1 w-1 rounded-full bg-brand animate-pulse" />
          <p className="text-[9px] font-black text-text-secondary opacity-40 uppercase tracking-widest leading-none">
            Authorized Terminal Session
          </p>
        </div>
      </div>
    </div>
  );
}
