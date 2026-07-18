"use client";

import React, { useState } from 'react';
import {
  Search,
  Network,
  Menu,
  RefreshCcw,
  ChevronRight,
  Plus,
  CheckCircle2,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { Drawer } from 'vaul';

const DistributorRow = ({ distributor, onClick }) => {
  return (
    <div 
      onClick={() => { haptics.light(); onClick(distributor); }}
      className="flex items-center justify-between py-3 border-b border-glass-border/30 px-1 active:bg-brand/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-glass-border/20 text-brand">
          <Network size={18} strokeWidth={2.5} />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">{distributor.name || 'Unknown Distributor'}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {distributor.phone || 'No phone'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-text-secondary opacity-40" />
            <span className="text-xs font-bold text-brand">
              {distributor.region || 'No region'}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </div>
  );
};

export default function DistributorsPage() {
  const { openDrawer } = useUIStore();
  const { data: distributorsData, isLoading, error, mutate } = useFetch('/distributors?size=5000');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add', 'view', 'edit'
  
  const [currentDistributor, setCurrentDistributor] = useState({ name: '', phone: '', region: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const distributors = distributorsData?.data || distributorsData || [];

  const handleOpenAdd = () => {
    haptics.medium();
    setDrawerMode('add');
    setCurrentDistributor({ name: '', phone: '', region: '', address: '' });
    setIsDrawerOpen(true);
  };

  const handleOpenView = (distributor) => {
    setDrawerMode('view');
    setCurrentDistributor(distributor);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = () => {
    haptics.light();
    setDrawerMode('edit');
  };

  const handleSave = async () => {
    if (!currentDistributor.name) return;
    setIsSaving(true);
    haptics.medium();
    try {
      if (drawerMode === 'add') {
        await api.distributors.create(currentDistributor);
      } else if (drawerMode === 'edit') {
        await api.distributors.update(currentDistributor.id, currentDistributor);
      }
      haptics.heavy();
      setIsDrawerOpen(false);
      mutate();
    } catch (err) {
      console.error('Save Distributor Failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDistributor.id) return;
    if (!window.confirm('Are you sure you want to delete this distributor?')) return;
    
    setIsDeleting(true);
    haptics.medium();
    try {
      await api.distributors.delete(currentDistributor.id);
      haptics.heavy();
      setIsDrawerOpen(false);
      mutate();
    } catch (err) {
      console.error('Delete Distributor Failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDistributors = Array.isArray(distributors) ? distributors.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.region?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const totalCount = distributorsData?.meta?.total || distributorsData?.total || distributors.length;

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl pt-[calc(var(--sat)+1rem)] pb-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-[42px] w-[42px] flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-10px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-main leading-none mb-1">Distributors</h1>
              <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-[10px] font-black">
                {searchTerm ? `${filteredDistributors.length} / ${totalCount}` : totalCount}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-text-secondary leading-none opacity-70">Distribution Network</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { haptics.light(); mutate(); }}
            className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm shadow-brand/30"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search distributors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/30 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {isLoading ? 'Loading...' : `${filteredDistributors.length} results`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-14 w-full border-b border-glass-border/10 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : filteredDistributors.length > 0 ? (
          <div className="flex flex-col">
            {filteredDistributors.map(distributor => (
              <DistributorRow key={distributor.id} distributor={distributor} onClick={handleOpenView} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Network size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No distributors found</p>
          </div>
        )}
      </section>

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[2.5rem] flex flex-col z-[301] shadow-2xl safe-area-inset-bottom outline-none max-h-[90dvh] pb-[calc(var(--sab)+2rem)]">
            <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
            
            <div className="flex flex-col overflow-y-auto no-scrollbar p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-text-main">
                    {drawerMode === 'add' ? 'New Distributor' : drawerMode === 'edit' ? 'Edit Distributor' : currentDistributor.name}
                  </h3>
                  <p className="text-xs font-bold text-text-secondary opacity-40">
                    {drawerMode === 'view' ? (currentDistributor.region || 'No region') : 'Distribution Network'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {drawerMode === 'view' && (
                    <>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        {isDeleting ? <RefreshCcw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                      <button
                        onClick={handleOpenEdit}
                        className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-main active:scale-95 transition-transform"
                      >
                        <Edit3 size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {drawerMode === 'view' ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Phone</span>
                    <span className="text-sm font-bold text-text-main">{currentDistributor.phone || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Region</span>
                    <span className="text-sm font-bold text-text-main">{currentDistributor.region || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Address</span>
                    <span className="text-sm font-bold text-text-main">{currentDistributor.address || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Distributor Name*</label>
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={currentDistributor.name}
                        onChange={(e) => setCurrentDistributor({ ...currentDistributor, name: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="07x xxxx xxx"
                        value={currentDistributor.phone}
                        onChange={(e) => setCurrentDistributor({ ...currentDistributor, phone: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Region</label>
                      <input
                        type="text"
                        placeholder="E.g., Colombo"
                        value={currentDistributor.region}
                        onChange={(e) => setCurrentDistributor({ ...currentDistributor, region: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Address</label>
                      <input
                        type="text"
                        placeholder="Enter full address"
                        value={currentDistributor.address}
                        onChange={(e) => setCurrentDistributor({ ...currentDistributor, address: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!currentDistributor.name || isSaving}
                    className="w-full h-12 bg-brand text-white rounded-2xl text-[13px] font-black mt-8 shadow-lg shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCcw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} strokeWidth={3} />
                        <span>{drawerMode === 'add' ? 'Register Distributor' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
