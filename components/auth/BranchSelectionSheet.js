"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ChevronRight, Building2, X, LogOut } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

export const BranchSelectionSheet = ({ isOpen, onClose, allowClose = true }) => {
  const { user, setSelectedBranch, logout } = useAuthStore();
  const [search, setSearch] = useState('');

  const branches = user?.branches || [];
  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.code && b.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (branch) => {
    haptics.heavy();
    setSelectedBranch(branch);
    onClose();
  };

  const handleLogout = () => {
    haptics.medium();
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
            onClick={allowClose ? onClose : undefined} 
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 1 }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] pb-6 shadow-2xl border-t border-glass-border pointer-events-auto flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-center pb-4 pt-3">
              <div className="w-14 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-4 px-6 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Select Branch</h2>
                <p className="text-xs font-bold text-text-secondary opacity-40 mt-1">
                  Context for {user?.name || 'Authorized User'}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleLogout} 
                  className="h-10 w-10 glass-panel border border-glass-border rounded-full flex items-center justify-center text-rose-500"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
                {allowClose && (
                  <button onClick={onClose} className="h-10 w-10 glass-panel border border-glass-border rounded-full flex items-center justify-center text-text-secondary">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar - Standard Style */}
            <div className="px-6 mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-slate-400 font-bold"
                />
              </div>
            </div>

            {/* Branch List */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar min-h-[40vh]">
              <div className="flex flex-col">
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

                {filteredBranches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Building2 size={40} strokeWidth={1} />
                    <p className="text-[11px] font-bold mt-4">No matching locations</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
