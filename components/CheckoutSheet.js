"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Plus, 
  User, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Check,
  CheckCircle2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';

export const CheckoutSheet = ({ isOpen, onClose, cart, isWholesale, onUpdateQty, onRemove, onClear, onFinish }) => {
  const [step, setStep] = useState(1); // 1: Review, 2: Customer, 3: Payment
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && step === 2) {
      fetchCustomers();
    }
  }, [isOpen, step]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.customers.getActiveList();
      if (res.status === 'success') {
        setCustomers(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleNext = () => {
    haptics.medium();
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    haptics.light();
    setStep(prev => prev - 1);
  };

  const handleFinish = () => {
    haptics.heavy();
    onFinish(selectedCustomer);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Container */}
      <div className="relative w-full max-w-xl bg-surface rounded-t-[3rem] p-6 shadow-2xl border-t border-glass-border animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header / Stepper */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button onClick={handleBack} className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-text-secondary">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-black text-text-main leading-none">
                {step === 1 ? 'Review Order' : step === 2 ? 'Select Customer' : 'Finalize Sale'}
              </h2>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-brand' : 'w-2 bg-surface-muted'}`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 glass-panel rounded-full flex items-center justify-center text-rose-500 active:scale-90 transition-transform">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {step === 1 && (
            <div className="flex flex-col gap-3 pb-4">
              {cart.map(item => (
                <div key={item.id} className="glass-panel p-4 rounded-3xl flex items-center justify-between animate-in slide-in-from-left duration-300">
                  <div className="flex flex-col gap-0.5 flex-1 pr-4">
                    <span className="font-bold text-text-main text-sm truncate uppercase tracking-tight">{item.name}</span>
                    <span className="text-[10px] text-text-secondary font-bold">LKR {parseFloat(item.price).toLocaleString()} / Unit</span>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-muted rounded-2xl p-1.5 px-4 border border-glass-border">
                    <button onClick={() => onUpdateQty(item.id, -1)} className="text-text-secondary active:scale-75 transition-transform"><Minus size={14} /></button>
                    <span className="font-black text-text-main text-sm min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} className="text-brand active:scale-125 transition-transform"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <ShoppingCart size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-bold tracking-tight">Cart is empty</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 pb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  placeholder="Find customer..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid gap-2">
                {/* Walk-in Option */}
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className={`glass-panel p-4 rounded-3xl flex items-center justify-between transition-all border ${!selectedCustomer ? 'border-brand bg-brand/10' : 'border-glass-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-surface-muted flex items-center justify-center text-text-secondary">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-text-main">Walk-in Customer</p>
                      <p className="text-[10px] font-medium text-text-secondary">Standard Pricing</p>
                    </div>
                  </div>
                  {!selectedCustomer && <CheckCircle2 className="text-brand" size={20} />}
                </button>

                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-surface-muted rounded-3xl" />)}
                  </div>
                ) : (
                  filteredCustomers.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => { haptics.light(); setSelectedCustomer(c); }}
                      className={`glass-panel p-4 rounded-3xl flex items-center justify-between transition-all border ${selectedCustomer?.id === c.id ? 'border-brand bg-brand/10' : 'border-glass-border'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                          <User size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-text-main">{c.name}</p>
                          <p className="text-[10px] font-bold text-text-secondary">{c.phone || 'No phone profile'}</p>
                        </div>
                      </div>
                      {selectedCustomer?.id === c.id && <CheckCircle2 className="text-brand" size={20} />}
                    </button>
                  ))
                )}
              </div>

              <button className="h-14 border-2 border-dashed border-glass-border rounded-3xl flex items-center justify-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-widest hover:border-brand/40 hover:text-brand transition-all">
                <UserPlus size={16} /> New Customer
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 pb-4">
              <div className="glass-panel p-6 rounded-[2.5rem] bg-brand text-white shadow-xl shadow-brand/20 flex flex-col items-center text-center gap-4 border-none">
                <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                  <CreditCard size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Payable Amount</p>
                  <h3 className="text-4xl font-black tracking-tighter">LKR {total.toLocaleString()}</h3>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between px-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Customer</span>
                  <span className="text-sm font-bold text-text-main">{selectedCustomer ? selectedCustomer.name : 'Walk-in'}</span>
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Items</span>
                  <span className="text-sm font-bold text-text-main">{cart.length} Products</span>
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Pricing</span>
                  <span className="text-sm font-bold text-amber-500">{isWholesale ? 'Wholesale' : 'Retail'}</span>
                </div>
              </div>

              <div className="mt-4 p-4 glass-panel rounded-3xl bg-surface-muted/50 border-glass-border">
                <p className="text-[10px] font-bold text-text-secondary text-center uppercase mb-2">Payment Method</p>
                <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-2 border border-brand text-brand shadow-lg shadow-brand/10">
                    <Check size={16} strokeWidth={3} /> <span className="text-xs font-bold">Cash</span>
                  </div>
                  <div className="flex-1 h-12 bg-surface-muted/30 rounded-2xl flex items-center justify-center text-text-secondary text-xs font-bold opacity-40 grayscale">
                    Card
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-glass-border flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-text-secondary leading-none">Grand Total</span>
              <span className="text-lg font-black text-text-main">LKR {total.toLocaleString()}</span>
            </div>
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={cart.length === 0}
                className="h-14 px-8 btn-primary rounded-2xl text-sm font-bold flex items-center gap-2 group transition-all"
              >
                {step === 1 ? 'Customer' : 'Payment'} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold flex items-center gap-2 group transition-all shadow-xl shadow-emerald-500/20"
              >
                Sync Order <Check size={18} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
