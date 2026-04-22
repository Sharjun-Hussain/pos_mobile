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
  UserPlus,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "50%" : "-50%",
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? "50%" : "-50%",
    opacity: 0
  })
};

export const CheckoutSheet = ({ isOpen, onClose, onFinish }) => {
  // Consume Global Stores
  const { cart, updateQty, clearCart, getTotal } = useCartStore();
  const { isWholesale } = useSettingsStore();

  const [[step, direction], setStepState] = useState([1, 0]);
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

  const total = getTotal();

  const handleNext = () => {
    haptics.medium();
    setStepState([step + 1, 1]);
  };

  const handleBack = () => {
    haptics.light();
    setStepState([step - 1, -1]);
  };

  const handleFinish = () => {
    haptics.heavy();
    onFinish(selectedCustomer);
    // Clear cart on success
    setTimeout(() => {
      clearCart();
      setStepState([1, 0]);
    }, 500);
  };

  const handleClose = () => {
    setStepState([1, 0]); 
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
            onClick={handleClose} 
          />
          
          {/* Draggable Container */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 1 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.05}
            onDragEnd={(e, info) => {
              if (info.offset.y > 150 || info.velocity.y > 800) {
                handleClose();
              }
            }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] pb-6 shadow-2xl border-t border-glass-border pointer-events-auto flex flex-col max-h-[90vh] touch-none"
          >
            {/* Native Drag Handle */}
            <div className="flex justify-center pb-4 -mt-2 cursor-grab active:cursor-grabbing">
              <div className="w-14 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

            {/* Header / Stepper */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6">
              <div className="flex items-center gap-4">
                {step > 1 && (
                  <button onClick={handleBack} className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-text-secondary">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold text-text-main leading-none">
                    {step === 1 ? 'Review Order' : step === 2 ? 'Select Customer' : 'Finalize Sale'}
                  </h2>
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-brand' : 'w-2 bg-surface-muted'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="h-12 w-12 glass-panel rounded-full flex items-center justify-center text-rose-500 active:scale-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            {/* Animated Content Wizard */}
            <div className="flex-1 overflow-hidden relative min-h-[40vh]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full"
                >
                  {step === 1 && (
                    <div className="flex flex-col overflow-y-auto max-h-[55vh] no-scrollbar overscroll-contain bg-surface-muted/5 border-y border-glass-border/20">
                      {cart.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-4 px-6 pointer-events-auto gap-4 ${
                            idx !== cart.length - 1 ? 'border-b border-glass-border/20' : ''
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-bold text-text-main text-[14px] leading-snug line-clamp-2">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-text-secondary font-medium">
                              LKR {parseFloat(item.price).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-0.5 flex-shrink-0 bg-surface-muted/40 rounded-xl p-0.5 px-0.5 border border-glass-border/40 scale-[0.85] origin-right">
                            <button 
                              onClick={() => updateQty(item.id, -1)} 
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary active:text-brand transition-colors"
                            >
                              <Minus size={13} strokeWidth={2.5} />
                            </button>
                            <span className="font-bold text-text-main text-xs min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQty(item.id, 1)} 
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-brand active:scale-110 active:text-brand transition-all"
                            >
                              <Plus size={13} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {cart.length === 0 && (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                          <ShoppingCart size={64} className="mb-4" />
                          <p className="text-sm font-bold tracking-tight">Cart is empty</p>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-4 pb-4 pointer-events-auto px-6">
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

                      <div className="grid gap-2 max-h-[40vh] overflow-y-auto no-scrollbar pb-2">
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
                                  <p className="text-sm font-bold text-text-main">{c.name}</p>
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
                    <div className="flex flex-col gap-6 pb-4 pointer-events-auto px-6">
                      <div className="glass-panel p-6 rounded-[3rem] bg-brand text-white shadow-xl shadow-brand/20 flex flex-col items-center text-center gap-4 border-none">
                        <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                          <CreditCard size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Payable Amount</p>
                          <h3 className="text-4xl font-bold tracking-tighter">LKR {total.toLocaleString()}</h3>
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
                          <div className="flex-1 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-3 border border-brand text-brand shadow-lg shadow-brand/10">
                            <Check size={16} strokeWidth={3} /> <span className="text-xs font-bold">Cash</span>
                          </div>
                          <div className="flex-1 h-12 bg-surface-muted/30 rounded-2xl flex items-center justify-center text-text-secondary text-xs font-bold opacity-40 grayscale">
                            Card
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-glass-border flex flex-col gap-4 pointer-events-auto px-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-secondary leading-none">Grand Total</span>
                  <span className="text-lg font-bold text-text-main">LKR {total.toLocaleString()}</span>
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
