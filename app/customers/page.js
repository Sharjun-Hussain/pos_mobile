"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  ChevronRight, 
  Menu, 
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

const CustomerListItem = ({ customer }) => {
  return (
    <div className="glass-panel p-4 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
          <Users size={22} strokeWidth={2.5} />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-black text-text-main text-sm truncate leading-tight">{customer.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-text-secondary opacity-60 truncate">
              {customer.phone || 'No Phone'}
            </span>
            {customer.email && (
              <>
                <div className="h-1 w-1 rounded-full bg-text-secondary/20" />
                <span className="text-[10px] font-bold text-text-secondary opacity-60 truncate">
                  {customer.email}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-10 w-10 glass-panel border-glass-border/20 rounded-xl flex items-center justify-center text-text-secondary/40">
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const { openDrawer } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  
  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.customers.getActiveList();
      setCustomers(res.data || []);
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
        fetchCustomers();
      }
    } catch (err) {
      console.error('Create Customer Failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="p-6 pb-24 flex flex-col gap-6 min-h-screen">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Customers</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">Relationship Registry</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.medium(); setIsAdding(true); }}
          className="h-12 w-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-transform"
        >
          <UserPlus size={24} />
        </button>
      </header>

      <section className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-text-main outline-none focus:border-brand/40 transition-all text-sm font-medium placeholder:text-text-secondary/50"
          />
        </div>
        <button 
          onClick={() => { haptics.light(); fetchCustomers(); }}
          className="h-14 w-14 glass-panel border-glass-border/30 rounded-2xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1 px-1">
          <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">
            {loading ? 'Refreshing Registry...' : `${filteredCustomers.length} registered customers`}
          </h2>
        </div>
        
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-20 w-full glass-panel rounded-[2rem] animate-pulse bg-surface-muted/50" />
          ))
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <CustomerListItem key={customer.id} customer={customer} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Users size={48} strokeWidth={1} />
            <p className="text-xs font-bold mt-4">No customers found</p>
          </div>
        )}
      </section>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[3rem] p-8 pb-12 z-[301] shadow-2xl safe-area-inset-bottom"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-text-main tracking-tight">New Customer</h3>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Growth Registry</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="h-10 w-10 glass-panel border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
                >
                  <RefreshCcw size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Full Name*</label>
                  <input 
                    type="text" 
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl px-5 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="07x xxxx xxx"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl px-5 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="customer@inzeedo.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl px-5 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name || isSaving}
                className="btn-primary w-full h-16 rounded-[2rem] text-sm mt-8 shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
