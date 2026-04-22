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
  ShoppingCart,
  Percent,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { App } from '@capacitor/app';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { 
    cart, 
    updateQty, 
    clearCart, 
    getTotal, 
    getSubtotal, 
    discount, 
    adjustment, 
    setDiscount, 
    setAdjustment,
    getDiscountAmount 
  } = useCartStore();
  const { selectedBranch } = useAuthStore();
  const { isWholesale, activePaymentMethods, currency, checkoutPreview } = useSettingsStore();

  const [[step, direction], setStepState] = useState([checkoutPreview ? 1 : 2, 0]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (isOpen && step === 2) {
      fetchCustomers();
    }
  }, [isOpen, step]);

  // Handle Native Hardware Back Button
  useEffect(() => {
    if (!isOpen) return;

    const backListener = App.addListener('backButton', () => {
      // Logic: Form -> Steps -> Close
      if (isAddingCustomer) {
        haptics.light();
        setIsAddingCustomer(false);
      } else if (step > 1) {
        handleBack();
      } else {
        handleClose();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [isOpen, step, isAddingCustomer]);

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

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleNext = () => {
    haptics.medium();
    setStepState([step + 1, 1]);
  };

  const handleBack = () => {
    haptics.light();
    setStepState([step - 1, -1]);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;
    setLoading(true);
    haptics.medium();
    try {
      const res = await api.customers.create(newCustomer);
      if (res.status === 'success') {
        const createdCustomer = res.data;
        haptics.heavy();
        setCustomers(prev => [createdCustomer, ...prev]);
        setSelectedCustomer(createdCustomer);
        setIsAddingCustomer(false);
        setNewCustomer({ name: '', phone: '', email: '' });
      }
    } catch (e) {
      console.error('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (targetStatus = 'completed') => {
    if (cart.length === 0) return;
    setIsSyncing(true);
    setShowActions(false);
    haptics.heavy();

    try {
      // Map cart to backend expected schema
      const payload = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          product_id: item.productId,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          discount_amount: 0 
        })),
        payment_method: paymentMethod,
        adjustment: parseFloat(adjustment || 0) || 0,
        paid_amount: paymentMethod === 'cash' ? (parseFloat(amountTendered) || total) : total,
        status: targetStatus,
        is_wholesale: isWholesale,
        branch_id: selectedBranch?.id
      };

      const res = await api.sales.create(payload);
      
      if (res.status === 'success') {
        haptics.heavy();
        clearCart(); // Clear immediately to reset adjustments/cart
        onFinish(selectedCustomer); 
        
        setTimeout(() => {
          setStepState([1, 0]);
          setPaymentMethod('cash');
          setAmountTendered('');
          setIsSyncing(false);
        }, 500);
      }
    } catch (e) {
      console.error('Sale Sync Failed:', e);
    } finally {
      setIsSyncing(false);
    }
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
            <div className="flex items-center justify-between mb-6 px-6 pt-2">
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
                  className="w-full h-full flex flex-col"
                >
                  {step === 1 && (
                    <div className="flex-1 flex flex-col pointer-events-auto">
                      {/* Financial Adjustments Bar */}
                      <div className="flex items-center gap-3 px-6 mb-5">
                        <div className="flex-1 glass-panel bg-surface-muted/30 border-glass-border/40 p-2.5 px-4 rounded-2xl flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                            <Percent size={14} strokeWidth={3} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-[9px] font-bold text-text-secondary leading-none mb-1">Discount (%)</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={discount || ''}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="bg-transparent border-none p-0 text-sm font-black text-text-main outline-none placeholder:text-text-secondary/30 w-full"
                              />
                              <span className="text-[10px] font-bold text-rose-500">%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 glass-panel bg-surface-muted/30 border-glass-border/40 p-2.5 px-4 rounded-2xl flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <Calculator size={14} strokeWidth={3} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-[9px] font-bold text-text-secondary leading-none mb-1">Adjust</span>
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              value={adjustment || ''}
                              onChange={(e) => setAdjustment(e.target.value)}
                              className="bg-transparent border-none p-0 text-sm font-black text-text-main outline-none placeholder:text-text-secondary/30 w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Wide-Format List */}
                      <div className="flex-1 overflow-y-auto max-h-[50vh] no-scrollbar overscroll-contain bg-surface-muted/5 border-y border-glass-border/20">
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
                                {currency} {parseFloat(item.price).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-0.5 flex-shrink-0 bg-surface-muted/40 rounded-xl p-0.5 px-0.5 border border-glass-border/40 scale-[0.85] origin-right">
                              <button onClick={() => updateQty(item.id, -1)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary active:text-brand transition-colors">
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span className="font-bold text-text-main text-xs min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="h-8 w-8 rounded-lg flex items-center justify-center text-brand active:scale-110 active:text-brand transition-all">
                                <Plus size={13} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {cart.length === 0 && (
                          <div className="text-center py-20 opacity-30 flex flex-col items-center">
                            <ShoppingCart size={64} className="mb-4" />
                            <p className="text-sm font-bold">Cart is empty</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-4 pb-4 pointer-events-auto">
                      {!isAddingCustomer ? (
                        <>
                          <div className="relative px-6">
                            <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                            <input 
                              type="text" 
                              placeholder="Find customer..." 
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                            />
                          </div>

                          <div className="flex flex-col bg-surface-muted/5 border-y border-glass-border/20 overflow-hidden overflow-y-auto max-h-[42vh] min-h-[30vh] no-scrollbar overscroll-contain">
                            <button 
                              onClick={() => { haptics.light(); setSelectedCustomer(null); }}
                              className={`flex items-center justify-between p-4 px-8 transition-all border-b border-glass-border/10 ${!selectedCustomer ? 'bg-brand/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center text-text-secondary">
                                    <User size={20} />
                                  </div>
                                  <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-text-main truncate">Walk-in Customer</p>
                                    <p className="text-[10px] font-medium text-text-secondary">Standard Retail Pricing</p>
                                  </div>
                                </div>
                                {!selectedCustomer && <CheckCircle2 className="text-brand shrink-0" size={18} />}
                              </button>

                              {loading ? (
                                <div className="p-6 space-y-4">
                                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-surface-muted/50 rounded-xl animate-pulse" />)}
                                </div>
                              ) : (
                                filteredCustomers.map((c, idx) => (
                                  <button 
                                    key={c.id}
                                    onClick={() => { haptics.light(); setSelectedCustomer(c); }}
                                    className={`flex items-center justify-between p-4 px-6 transition-all ${
                                      idx !== filteredCustomers.length - 1 ? 'border-b border-glass-border/10' : ''
                                    } ${selectedCustomer?.id === c.id ? 'bg-brand/5' : ''}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                        <User size={20} />
                                      </div>
                                      <div className="text-left overflow-hidden">
                                        <p className="text-sm font-bold text-text-main truncate">{c.name}</p>
                                        <p className="text-[10px] font-bold text-text-secondary truncate">{c.phone || 'No phone profile'}</p>
                                      </div>
                                    </div>
                                    {selectedCustomer?.id === c.id && <CheckCircle2 className="text-brand shrink-0" size={18} />}
                                  </button>
                                ))
                              )}
                            </div>

                          {/* Fixed Footer within Step */}
                          <div className="px-6 py-4">
                            <button 
                              onClick={() => { haptics.medium(); setIsAddingCustomer(true); }}
                              className="w-full h-14 border-2 border-dashed border-glass-border rounded-3xl flex items-center justify-center gap-2 text-text-secondary text-xs font-bold hover:border-brand/40 hover:text-brand transition-all"
                            >
                              <UserPlus size={16} /> New Customer
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-2 flex flex-col gap-5 overflow-y-auto no-scrollbar">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-text-main">Quick Registration</h3>
                            <button onClick={() => setIsAddingCustomer(false)} className="text-[10px] font-bold text-rose-500">Cancel</button>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary pl-1">Full Name *</label>
                              <input 
                                type="text"
                                placeholder="Enter customer name"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                className="w-full h-12 bg-surface-muted border border-glass-border rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary pl-1">Phone Number</label>
                              <input 
                                type="tel"
                                placeholder="07x xxxx xxx"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className="w-full h-12 bg-surface-muted border border-glass-border rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary pl-1">Email Address</label>
                              <input 
                                type="email"
                                placeholder="customer@example.com"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                className="w-full h-12 bg-surface-muted border border-glass-border rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={handleCreateCustomer}
                            disabled={!newCustomer.name || loading}
                            className="btn-primary w-full h-14 text-sm mt-2 disabled:opacity-50"
                          >
                            {loading ? 'Registering...' : 'Save & Select Customer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-4 pb-4 pointer-events-auto px-6 overflow-y-auto no-scrollbar max-h-[60vh]">
                      {/* Summary Card - High Contrast Glass Panel */}
                      <div className="p-6 rounded-[2.5rem] bg-brand shadow-2xl shadow-brand/20 flex flex-col items-center text-center gap-1 border border-white/20 relative overflow-hidden">
                        {/* Decorative Blur */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] -mr-16 -mt-16" />
                        
                        <p className="text-[10px] font-bold text-white/70">Payable Amount</p>
                        <h3 className="text-4xl font-black text-white">{currency} {total.toLocaleString()}</h3>
                        
                        {selectedCustomer && (
                          <div className="flex items-center gap-2 mt-2 bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                            <User size={12} className="text-white" strokeWidth={3} />
                            <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{selectedCustomer.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Mode Selector - Brand Themed */}
                      <div className="bg-surface-muted/30 p-1.5 rounded-2x border border-glass-border/20 flex gap-1">
                        {[
                          { id: 'cash', label: 'Cash', icon: Calculator },
                          { id: 'card', label: 'Card', icon: CreditCard },
                          { id: 'bank', label: 'Bank', icon: ChevronRight },
                          { id: 'qr', label: 'QR Pay', icon: CreditCard }
                        ]
                        .filter(m => activePaymentMethods?.includes(m.id))
                        .map((mode) => {
                          const Icon = mode.icon;
                          const isActive = paymentMethod === mode.id;
                          return (
                            <button
                              key={mode.id}
                              onClick={() => { haptics.light(); setPaymentMethod(mode.id); }}
                              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                                isActive 
                                  ? 'bg-brand shadow-lg shadow-brand/20 text-white scale-100' 
                                  : 'text-text-secondary opacity-60 scale-95 hover:opacity-100 hover:bg-brand/5'
                              }`}
                            >
                              <Icon size={14} strokeWidth={3} />
                              <span className="text-[11px] font-bold">{mode.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Cash Logic Area */}
                      {paymentMethod === 'cash' && (
                        <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-text-secondary pl-1">Amount Tendered</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand">{currency}</span>
                              <input 
                                type="number"
                                placeholder={total.toString()}
                                value={amountTendered}
                                onChange={(e) => setAmountTendered(e.target.value)}
                                className="w-full h-12 bg-surface-muted/50 border border-brand/20 rounded-xl pl-12 pr-4 text-base font-black text-text-main outline-none focus:border-brand/50"
                              />
                            </div>
                          </div>
                          
                          {amountTendered && parseFloat(amountTendered) > total && (
                            <div className="flex items-center justify-between bg-brand/5 border border-brand/10 p-3 rounded-xl">
                              <span className="text-[10px] font-bold text-brand">Change</span>
                              <span className="text-base font-black text-brand">{currency} {(parseFloat(amountTendered) - total).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Small Breakdown - High Density */}
                      <div className="space-y-1.5 border-t border-glass-border/30 pt-3 px-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-secondary font-bold">Subtotal</span>
                          <span className="text-text-main font-black">{currency} {subtotal.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-rose-500 font-bold">Discount ({discount}%)</span>
                            <span className="text-rose-500 font-black">- {currency} {getDiscountAmount().toLocaleString()}</span>
                          </div>
                        )}
                        {adjustment !== 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-brand font-bold">Adjustment</span>
                            <span className="text-brand font-black">{adjustment > 0 ? '+' : '-'} {currency} {Math.abs(adjustment).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions with DYNAMIC TOOLBAR */}
            <div className="pt-6 border-t border-glass-border flex flex-col gap-4 pointer-events-auto px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  {step === 3 ? (
                    <>
                      <button 
                        onClick={() => setShowActions(!showActions)}
                        className="w-full h-14 glass-panel border-2 border-glass-border/30 rounded-2xl flex items-center justify-center gap-2 text-text-main hover:border-brand/40 transition-all active:scale-95"
                      >
                        <Calculator size={16} className="text-text-secondary" />
                        <span className="text-sm font-bold">More</span>
                      </button>

                      <AnimatePresence>
                        {showActions && (
                          <motion.div 
                            initial={{ y: 10, opacity: 0, scale: 0.95 }}
                            animate={{ y: -4, opacity: 1, scale: 1 }}
                            exit={{ y: 10, opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full left-0 w-48 bg-surface rounded-2xl shadow-2xl p-1.5 border border-glass-border mb-2 z-[200]"
                          >
                            <button 
                              onClick={() => { haptics.medium(); handleFinish('draft'); }}
                              className="w-full p-3 rounded-xl flex items-center gap-3 text-text-main hover:bg-brand/5 active:bg-brand/10 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                <Plus size={16} strokeWidth={3} />
                              </div>
                              <span className="text-xs font-bold">Hold Sale</span>
                            </button>
                            <button 
                              onClick={() => { haptics.heavy(); clearCart(); handleClose(); }}
                              className="w-full p-3 rounded-xl flex items-center gap-3 text-rose-500 hover:bg-rose-500/5 active:bg-rose-500/10 transition-colors border-t border-glass-border/10 mt-1"
                            >
                              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <Trash2 size={16} strokeWidth={3} />
                              </div>
                              <span className="text-xs font-bold">Clear Cart</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="bg-surface border-2 border-brand/20 text-brand px-5 h-14 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="text-lg font-black text-brand">{currency} {total.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1">
                  {step < 3 ? (
                    <button 
                      onClick={handleNext}
                      disabled={cart.length === 0}
                      className="bg-brand text-white px-5 h-14 rounded-2xl shadow-xl shadow-brand/20 border border-brand/50 flex items-center justify-center gap-2 group transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-sm font-black">{step === 1 ? 'Customer' : 'Payment'}</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleFinish('completed')}
                      disabled={isSyncing}
                      className="bg-brand text-white px-5 h-14 rounded-2xl shadow-xl shadow-brand/20 border border-brand/50 flex items-center justify-center gap-2 group transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-sm font-black">{isSyncing ? 'Saving...' : 'Complete'}</span>
                      <Check size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Syncing Overlay */}
            <AnimatePresence>
              {isSyncing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-[150] flex flex-col items-center justify-center gap-4 rounded-t-[3rem]"
                >
                  <div className="h-16 w-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-black text-brand">Synchronizing Order</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
