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
    <div className="min-h-screen bg-surface p-8 pt-16 flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="p-3 w-fit rounded-2xl bg-brand/10 text-brand shadow-sm">
            <Building2 size={24} />
          </div>
          <button 
            onClick={handleLogout}
            className="h-12 w-12 glass-panel rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
          >
            <LogOut size={20} />
          </button>
        </div>
        <h1 className="text-3xl font-black text-text-main mt-4">Select Branch</h1>
        <p className="text-sm font-bold text-text-secondary opacity-60">
          Working context for {user.organization?.name || 'Inzeedo POS'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={20} />
        <input 
          type="text"
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-16 bg-surface-muted border border-glass-border rounded-[1.75rem] pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40 transition-all shadow-sm"
        />
      </div>

      {/* Branch List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-12">
        <AnimatePresence mode="popLayout">
          {filteredBranches.map((branch, idx) => (
            <motion.button
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleSelect(branch)}
              className="glass-panel p-5 rounded-[2rem] flex items-center justify-between border-glass-border/30 hover:border-brand/40 group active:scale-[0.98] transition-all bg-white dark:bg-surface-muted/20"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-surface-muted flex items-center justify-center text-brand border border-glass-border shadow-sm group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-text-main leading-tight mb-1">{branch.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-secondary bg-surface-muted px-2 py-0.5 rounded-md border border-glass-border/50 uppercase tracking-wider">
                      {branch.code || 'MAIN'}
                    </span>
                    <span className="text-[10px] font-medium text-text-secondary truncate max-w-[150px]">
                      {branch.address || 'Standard Location'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={18} strokeWidth={3} />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {filteredBranches.length === 0 && (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
            <Building2 size={64} strikeWidth={1.5} />
            <p className="text-sm font-bold">No matching branches found</p>
          </div>
        )}
      </div>

      {/* Persistence Note */}
      <div className="mt-auto py-4 border-t border-glass-border/20 text-center">
        <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-[0.1em]">
          Session scoped to terminal local storage
        </p>
      </div>
    </div>
  );
}
