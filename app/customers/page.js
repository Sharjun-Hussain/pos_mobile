"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  UserPlus,
  ChevronRight,
  Menu,
  RefreshCcw,
  List,
  LayoutGrid,
  CheckCircle2,
  X
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { Drawer } from 'vaul';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';

const CustomerRow = ({ customer }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-glass-border/30 px-1 active:bg-brand/5 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-glass-border/20 text-brand">
          <Users size={18} strokeWidth={2.5} />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">{customer.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {customer.phone || 'No Phone'}
            </span>
            {customer.email && (
              <>
                <div className="h-0.5 w-0.5 rounded-full bg-text-secondary opacity-40" />
                <span className="text-xs font-bold text-text-secondary opacity-40 truncate">
                  {customer.email}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </div>
  );
};

const CustomerGridItem = ({ customer }) => {
  return (
    <div className="bg-surface border border-glass-border/30 rounded-2xl p-4 flex flex-col items-center text-center gap-3 active:scale-[0.98] transition-all shadow-sm">
      <div className="h-14 w-14 rounded-full bg-brand/5 text-brand flex items-center justify-center border border-brand/10">
        <Users size={24} strokeWidth={2.5} />
      </div>
      <div className="overflow-hidden w-full">
        <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-1">{customer.name}</h4>
        <p className="text-xs font-bold text-text-secondary opacity-60 truncate">{customer.phone || 'No Phone'}</p>
        <p className="text-xs font-medium text-text-secondary opacity-40 truncate mt-0.5">{customer.email || 'No Email'}</p>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const { data: customersData, isLoading: customersLoading, error: customersError, mutate: refetchCustomers } = useFetch('/customers/active/list');
  const { openDrawer } = useUIStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name-asc');
  const [isAdding, setIsAdding] = useState(false);

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  const customers = customersData || [];
  const loading = customersLoading;
  const error = customersError;

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;
    setIsSaving(true);
    haptics.medium();
    try {
      const res = await api.customers.create(newCustomer);
      if (res.status === 'success') {
        haptics.heavy();
        setIsAdding(false);
        setNewCustomer({ name: '', phone: '', email: '' });
        refetchCustomers();
      }
    } catch (err) {
      console.error('Create Customer Failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAndSortedCustomers = Array.isArray(customers) ? customers
    .filter(c =>
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    }) : [];

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main leading-none mb-1">Customers</h1>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-70">Relationship Registry</p>
          </div>
        </div>
        <button
          onClick={() => { haptics.light(); refetchCustomers(); }}
          className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        {/* Search Bar Row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>

        {/* View & Sort Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => { haptics.light(); setSortBy(e.target.value); }}
              className="h-9 bg-surface-muted border border-glass-border/30 rounded-lg px-2 text-xs font-bold text-text-secondary outline-none appearance-none pr-6 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { haptics.medium(); setIsAdding(true); }}
              className="h-9 px-3 rounded-lg bg-brand/5 text-brand text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <UserPlus size={12} strokeWidth={2.5} />
              <span>Add New</span>
            </button>
            <div className="flex bg-surface-muted p-1 rounded-lg border border-glass-border/20">
              <button
                onClick={() => { haptics.light(); setViewMode('list'); }}
                className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-surface shadow-sm text-brand border border-glass-border/20' : 'text-text-secondary opacity-50'}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => { haptics.light(); setViewMode('grid'); }}
                className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-surface shadow-sm text-brand border border-glass-border/20' : 'text-text-secondary opacity-50'}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/30 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {loading ? 'Refreshing Registry...' : `${filteredAndSortedCustomers.length} registered customers`}
          </h2>
        </div>

        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? "h-32 w-full rounded-2xl animate-pulse bg-surface-muted border border-glass-border/10" : "h-14 w-full border-b border-glass-border/10 animate-pulse bg-surface-muted"} />
            ))}
          </div>
        ) : filteredAndSortedCustomers.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {filteredAndSortedCustomers.map(customer => (
              viewMode === 'list'
                ? <CustomerRow key={customer.id} customer={customer} />
                : <CustomerGridItem key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Users size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No customers found</p>
          </div>
        )}
      </section>

      {/* Quick Add Modal */}
      <Drawer.Root open={isAdding} onOpenChange={setIsAdding}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[2.5rem] flex flex-col z-[301] shadow-2xl safe-area-inset-bottom outline-none max-h-[90dvh] pb-[calc(var(--sab)+2rem)]">
            <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
            
            <div className="flex flex-col overflow-y-auto no-scrollbar p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-text-main">New Customer</h3>
                  <p className="text-xs font-bold text-text-secondary opacity-40">Growth Registry</p>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Full Name*</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="07x xxxx xxx"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Email Address</label>
                  <input
                    type="email"
                    placeholder="customer@inzeedo.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name || isSaving}
                className="w-full h-12 bg-brand text-white rounded-2xl text-[13px] font-black mt-8 shadow-lg shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCcw size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={3} />
                    <span>Register Customer</span>
                  </>
                )}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
