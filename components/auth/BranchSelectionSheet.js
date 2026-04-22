"use client";

import React, { useState, useCallback, memo } from 'react';
import { MapPin, Search, ChevronRight, Building2, X, LogOut } from 'lucide-react';
import { Drawer } from 'vaul';
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

  const handleSelect = useCallback((branch) => {
    haptics.heavy();
    setSelectedBranch(branch);
    onClose();
  }, [setSelectedBranch, onClose]);

  const handleLogout = useCallback(() => {
    haptics.medium();
    logout();
    onClose();
  }, [logout, onClose]);

  return (
    <Drawer.Root 
        open={isOpen} 
        onOpenChange={(c) => allowClose && !c && onClose()}
        dismissible={allowClose}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl max-h-[90dvh]">
          {/* Drag Handle */}
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-8 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Select Branch</h2>
                <p className="text-xs font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-wide">
                  {user?.name || 'Context Selection'}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleLogout} 
                  className="h-11 w-11 bg-rose-500/10 border border-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
                {allowClose && (
                  <button 
                    onClick={onClose} 
                    className="h-11 w-11 bg-surface-muted border border-glass-border/30 rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-8 mb-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Search active branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-secondary/40"
                />
              </div>
            </div>

            {/* Branch List */}
            <div className="flex-1 overflow-y-auto px-8 pb-12 no-scrollbar min-h-[30vh] pb-[calc(var(--sab)+2rem)]">
              <div className="flex flex-col gap-1">
                {filteredBranches.map((branch) => (
                  <div
                    key={branch.id}
                    onClick={() => handleSelect(branch)}
                    className="flex items-center justify-between py-4 border-b border-glass-border/10 px-2 active:bg-brand/5 transition-colors cursor-pointer group rounded-xl"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="h-12 w-12 rounded-2xl bg-surface-muted flex items-center justify-center flex-shrink-0 text-text-secondary group-hover:text-brand group-hover:bg-brand/10 transition-colors border border-glass-border/20">
                        <MapPin size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-text-main text-[14px] truncate leading-tight">
                            {branch.name}
                          </h4>
                          {branch.code && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-surface-muted text-text-secondary group-hover:bg-brand/5 group-hover:text-brand transition-colors tracking-widest uppercase">
                              {branch.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-text-secondary opacity-60 truncate">
                          {branch.address || 'Standard Location'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary opacity-30 group-hover:text-brand transition-colors ml-4" />
                  </div>
                ))}

                {filteredBranches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20">
                    <Building2 size={48} strokeWidth={1} />
                    <p className="text-xs font-bold mt-4 uppercase tracking-widest text-center">No locations found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
