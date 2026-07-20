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
import { Drawer } from 'vaul';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useShiftStore } from '@/store/useShiftStore';

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
    getDiscountAmount,
    getTaxAmount,
    getVATAmount,
    getSSCLAmount 
  } = useCartStore();
  const { selectedBranch, user } = useAuthStore();
  const { isWholesale, activePaymentMethods, currency: currentCurrency, checkoutPreview, vatRate, ssclRate, enableTax, requireShift } = useSettingsStore();
  const { activeShift } = useShiftStore();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const businessType = (user?.organization?.business_type || "").toLowerCase();
  const isManufacturer = businessType === 'manufacturing' || businessType === 'manufacturer';

  const [[step, direction], setStepState] = useState([checkoutPreview ? 1 : 2, 0]);
  const [isCustomerView, setIsCustomerView] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', company_name: '' });
  const [payments, setPayments] = useState([
    { id: Date.now(), method: 'cash', amount: 0 }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();

  useEffect(() => {
    if (isOpen && step === 2) {
      fetchCustomers();
    }
    if (isOpen && step === 3 && payments[0].amount === 0) {
      // Auto-set the first payment amount to total for retail, leave as 0 for manufacturing (credit by default)
      if (!isManufacturer) {
        setPayments(prev => [{ ...prev[0], amount: Number(total.toFixed(2)) }]);
      }
    }
  }, [isOpen, step, total, isCustomerView]);

  const addPayment = () => {
    haptics.light();
    const remaining = total - payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    setPayments([...payments, { id: Date.now(), method: 'cash', amount: remaining > 0 ? Number(remaining.toFixed(2)) : 0 }]);
  };

  const removePayment = (id) => {
    if (payments.length <= 1) return;
    haptics.light();
    setPayments(payments.filter(p => p.id !== id));
  };

  const updatePayment = (id, field, value) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Handle Native Hardware Back Button
  useEffect(() => {
    if (!isOpen) return;

    const backListener = App.addListener('backButton', async () => {
      // 1. Close keyboard if open
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      if (isInputFocused) {
        activeElement.blur();
        await Keyboard.hide();
        return;
      }

      // 2. Logic: Form -> Steps -> Close
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
      const isActuallyCustomer = !isManufacturer || isCustomerView;
      const res = isActuallyCustomer
        ? await api.customers.getActiveList()
        : await api.distributors.getActiveList();
      if (res.status === 'success') {
        setCustomers(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch entities');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const handleNext = () => {
    haptics.medium();
    setStepState([step + 1, 1]);
  };

  const handleBack = () => {
    haptics.light();
    if (step === 3) {
      setPayments([{ id: Date.now(), method: 'cash', amount: 0 }]);
    }
    setStepState([step - 1, -1]);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;
    setLoading(true);
    haptics.medium();
    try {
      const isActuallyCustomer = !isManufacturer || isCustomerView;
      const payload = { ...newCustomer };
      if (!payload.email) delete payload.email; // Avoid backend rejecting empty string for unique email fields
      if (!payload.phone) delete payload.phone;

      const res = isActuallyCustomer
        ? await api.customers.create(payload)
        : await api.distributors.create(payload);
        
      const createdCustomer = res.data?.customer || res.data?.distributor || res.data || res;
      
      if (createdCustomer && createdCustomer.id) {
        haptics.heavy();
        setCustomers(prev => [createdCustomer, ...prev]);
        setSelectedCustomer(createdCustomer);
        setIsAddingCustomer(false);
        setNewCustomer({ name: '', phone: '', email: '', company_name: '' });
      } else {
        console.error("Unexpected create response:", res);
        alert("Customer created, but failed to auto-select. Please search for them.");
        setIsAddingCustomer(false);
        fetchCustomers();
      }
    } catch (e) {
      console.error('Failed to create entity', e);
      alert(e?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (targetStatus = 'completed') => {
    if (cart.length === 0 || isSyncing) return;

    if (!isManufacturer && !selectedCustomer && totalPaid < total) {
      alert("Walk-in customers must pay in full.");
      return;
    }

    setIsSyncing(true);
    setShowActions(false);
    haptics.heavy();

    try {
      const { vatRate, ssclRate, enableTax } = useSettingsStore.getState();
      
      const payload = {
        customer_id: (!isManufacturer || isCustomerView) && selectedCustomer ? selectedCustomer.id : null,
        distributor_id: (isManufacturer && !isCustomerView) && selectedCustomer ? selectedCustomer.id : null,
        items: cart.map(item => {
          const itemSubtotal = item.price * item.quantity;
          const itemDiscount = itemSubtotal * (discount / 100);
          const taxableAmount = itemSubtotal - itemDiscount;
          
          // Cascading Tax Calculation (Matching getVATAmount logic in Store)
          const ssclAmount = enableTax ? (taxableAmount * (ssclRate / 100)) : 0;
          const vatAmount = enableTax ? ((taxableAmount + ssclAmount) * (vatRate / 100)) : 0;
          
          return {
            product_id: item.productId,
            product_variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: item.price,
            discount_amount: parseFloat(itemDiscount.toFixed(2)),
            tax_amount: parseFloat((ssclAmount + vatAmount).toFixed(2)),
            sscl_amount: parseFloat(ssclAmount.toFixed(2)),
            vat_amount: parseFloat(vatAmount.toFixed(2)),
            total_amount: parseFloat((taxableAmount + ssclAmount + vatAmount).toFixed(2))
          };
        }),
        payments: payments.map(p => ({
          payment_method: p.method,
          amount: parseFloat(p.amount) || 0
        })),
        adjustment: parseFloat(adjustment || 0) || 0,
        paid_amount: parseFloat(totalPaid.toFixed(2)),
        total_amount: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(getDiscountAmount().toFixed(2)),
        tax_amount: parseFloat(getTaxAmount().toFixed(2)),
        sscl_amount: parseFloat(getSSCLAmount().toFixed(2)),
        vat_amount: parseFloat(getVATAmount().toFixed(2)),
        payable_amount: parseFloat(total.toFixed(2)),
        status: targetStatus,
        is_wholesale: isWholesale,
        branch_id: selectedBranch?.id,
        shift_id: activeShift?.id || null,
        notes: `[Terminal: MOBILE-POS]`
      };

      const res = await api.sales.create(payload);
      
      if (res.status === 'success') {
        const saleResponse = res.data?.sale || res.data;
        
        // Enrich the server response with our detailed local cart data (Names and Variants)
        const enrichedSale = {
          ...saleResponse,
          cashier: saleResponse.cashier || useAuthStore.getState().user,
          items: (saleResponse.items || []).map(serverItem => {
            // Find the item in our cart to get the friendly names
            const localItem = cart.find(c => 
              c.variantId === serverItem.product_variant_id || 
              c.productId === serverItem.product_id
            );
            
            return {
                ...serverItem,
                product_name: localItem?.productName || localItem?.name || serverItem.product_name,
                variant_name: localItem?.variantName !== 'Default' ? localItem?.variantName : null
            };
          })
        };

        haptics.heavy();
        clearCart(); 
        onFinish(enrichedSale); 
        
        setTimeout(() => {
          setStepState([1, 0]);
          setPayments([{ id: Date.now(), method: 'cash', amount: 0 }]);
          setIsSyncing(false);
        }, 500);
      } else {
        alert(res.message || "Failed to process sale.");
        setIsSyncing(false);
      }
    } catch (e) {
      console.error('Sale Sync Failed:', e);
      alert(e?.response?.data?.message || e.message || "Sale Sync Failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatWeight = (qty, unit) => {
    if (!qty || !unit) return qty;
    const u = unit.toLowerCase();
    if (u === 'kg') {
      if (qty < 1) return `${(qty * 1000).toFixed(0)} g`;
      return `${qty} Kg`;
    }
    return `${qty} ${unit}`;
  };

  const isWeighted = (unit) => ['kg', 'g', 'l', 'm'].includes(unit?.toLowerCase());

  const handleClose = () => {
    setStepState([1, 0]); 
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[111] outline-none shadow-2xl h-[95dvh] pb-[calc(var(--sab)+1rem)]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">

            {/* Header / Stepper */}
            <div className="flex items-center justify-between mb-6 px-6 pt-2">
              <div className="flex items-center gap-4">
                {step > 1 && (
                  <button onClick={handleBack} className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-text-secondary">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <Drawer.Title className="text-xl font-bold text-text-main leading-none">
                    {step === 1 ? 'Review Order' : step === 2 ? ((!isManufacturer || isCustomerView) ? 'Select Customer' : 'Select Distributor') : 'Finalize Sale'}
                  </Drawer.Title>
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
              {step === 1 && (
                <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto">
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
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-text-main text-[14px] leading-snug line-clamp-1">
                                  {item.name}
                                </span>
                                {isWeighted(item.unit) && (
                                  <span className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">
                                    {formatWeight(item.quantity, item.unit)}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-text-secondary font-medium">
                                {formatCurrency(parseFloat(item.price))} {isWeighted(item.unit) && `per ${item.unit}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0 origin-right">
                              <div className="flex items-center gap-0.5 bg-surface-muted/40 rounded-xl p-0.5 px-0.5 border border-glass-border/40 scale-[0.85]">
                                <button onClick={() => updateQty(item.id, -1)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary active:text-brand transition-colors">
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span className="font-bold text-text-main text-xs min-w-[30px] text-center">
                                  {isWeighted(item.unit) ? formatWeight(item.quantity, item.unit) : item.quantity}
                                </span>
                                <button onClick={() => updateQty(item.id, 1)} className="h-8 w-8 rounded-lg flex items-center justify-center text-brand active:scale-110 active:text-brand transition-all">
                                  <Plus size={13} strokeWidth={3} />
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => { haptics.medium(); useCartStore.getState().removeItem(item.id); }}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-rose-500 bg-rose-500/5 border border-rose-500/10 active:bg-rose-500/20 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {cart.length === 0 && (
                          <div className="text-center py-20 opacity-30 flex flex-col items-center">
                            <ShoppingCart size={64} className="mb-4" />
                            <p className="text-sm font-bold">{t('pos.cartEmpty')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-4 pb-4 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                      
                      {isManufacturer && !isAddingCustomer && (
                        <div className="px-6">
                            <div className="flex p-1 bg-surface-muted/30 border border-glass-border rounded-xl">
                              <button
                                onClick={() => { setIsCustomerView(false); setSelectedCustomer(null); }}
                                className={`flex-1 h-10 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isCustomerView ? 'bg-surface shadow-sm text-text-main' : 'text-text-secondary hover:bg-surface-muted/50'}`}
                              >
                                Distributor
                              </button>
                              <button
                                onClick={() => { setIsCustomerView(true); setSelectedCustomer(null); }}
                                className={`flex-1 h-10 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isCustomerView ? 'bg-surface shadow-sm text-text-main' : 'text-text-secondary hover:bg-surface-muted/50'}`}
                              >
                                Customer
                              </button>
                            </div>
                        </div>
                      )}

                      {!isAddingCustomer ? (
                        <>
                          <div className="relative px-6">
                            <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                            <input 
                              type="text" 
                              placeholder={(!isManufacturer || isCustomerView) ? t('common.search') : 'Search distributors...'}
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                            />
                          </div>

                          <div className="flex-1 flex flex-col bg-surface-muted/5 border-y border-glass-border/20 overflow-hidden overflow-y-auto no-scrollbar overscroll-contain">
                            <button 
                              onClick={() => { haptics.light(); setSelectedCustomer(null); }}
                              className={`flex items-center justify-between p-4 px-8 transition-all border-b border-glass-border/10 ${!selectedCustomer ? 'bg-brand/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center text-text-secondary">
                                    <User size={20} />
                                  </div>
                                  <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-text-main truncate">{(!isManufacturer || isCustomerView) ? t('checkout.walkIn') : 'Cash Purchase'}</p>
                                    <p className="text-[10px] font-medium text-text-secondary">{(!isManufacturer || isCustomerView) ? 'Standard Retail Pricing' : 'No wholesale tracking'}</p>
                                  </div>
                                </div>
                                {!selectedCustomer && <CheckCircle2 className="text-brand shrink-0" size={18} />}
                              </button>

                              {loading ? (
                                <div className="p-6 space-y-4">
                                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-surface-muted/50 rounded-xl animate-pulse" />)}
                                </div>
                              ) : filteredCustomers.length > 0 ? (
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
                              ) : (
                                <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
                                  <div className="h-16 w-16 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary mb-4 opacity-50 border border-glass-border/30">
                                    <UserPlus size={28} strokeWidth={1.5} />
                                  </div>
                                  <p className="text-sm font-black text-text-main mb-1">
                                    {(!isManufacturer || isCustomerView) ? 'Customer not found' : 'Distributor not found'}
                                  </p>
                                  {search ? (
                                    <>
                                      <p className="text-[10px] font-bold text-text-secondary opacity-50 mb-6 max-w-[200px]">
                                        We couldn't find any match for "{search}".
                                      </p>
                                      <button 
                                        onClick={() => {
                                          haptics.medium();
                                          setNewCustomer({ ...newCustomer, name: search });
                                          setIsAddingCustomer(true);
                                        }}
                                        className="h-12 px-6 bg-brand text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-brand/20 active:scale-95 transition-transform w-full max-w-[200px]"
                                      >
                                        <Plus size={16} strokeWidth={3} />
                                        Create New
                                      </button>
                                    </>
                                  ) : (
                                    <p className="text-[10px] font-bold text-text-secondary opacity-50 mb-6 max-w-[200px]">
                                      Try searching for a name or phone number.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                          {/* Fixed Footer within Step */}
                          <div className="px-6 py-4 mt-auto border-t border-glass-border/10">
                            <button 
                              onClick={() => { haptics.medium(); setIsAddingCustomer(true); }}
                              className="w-full h-14 bg-brand text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
                            >
                              <UserPlus size={18} strokeWidth={2.5} />
                              {(!isManufacturer || isCustomerView) ? t('checkout.newCustomer') : 'New Distributor'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-2 flex flex-col gap-5 overflow-y-auto no-scrollbar">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-text-main">{(!isManufacturer || isCustomerView) ? 'Quick Registration' : 'New Distributor'}</h3>
                            <button onClick={() => setIsAddingCustomer(false)} className="text-[10px] font-bold text-rose-500">Cancel</button>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary pl-1">Full Name *</label>
                              <input 
                                type="text"
                                placeholder={(!isManufacturer || isCustomerView) ? "Enter customer name" : "Enter distributor name"}
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                className="w-full h-12 bg-surface-muted border border-glass-border rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                              />
                            </div>
                            {(isManufacturer && !isCustomerView) && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-text-secondary pl-1">Company Name</label>
                                <input 
                                  type="text"
                                  placeholder="Enter company / business name"
                                  value={newCustomer.company_name}
                                  onChange={(e) => setNewCustomer({...newCustomer, company_name: e.target.value})}
                                  className="w-full h-12 bg-surface-muted border border-glass-border rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                                />
                              </div>
                            )}
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
                            {loading ? 'Registering...' : ((!isManufacturer || isCustomerView) ? 'Save & Select Customer' : 'Save & Select Distributor')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-4 pb-4 pointer-events-auto px-6 overflow-y-auto no-scrollbar max-h-[60vh] animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Summary Card - Premium Minimalist Design */}
                      <div className="p-6 rounded-[2rem] bg-surface-muted/30 border border-glass-border/40 flex flex-col items-center text-center gap-1 relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-50" />
                        
                        <div className="relative z-10 flex flex-col items-center w-full">
                          <p className="text-sm font-bold text-text-secondary">Payable Amount</p>
                          <h3 className="text-5xl leading-none font-black text-text-main mt-2 tracking-tight">
                            {formatCurrency(total)}
                          </h3>
                          
                          {selectedCustomer && (
                            <div className="flex items-center gap-1.5 mt-4 bg-brand/10 px-3.5 py-1.5 rounded-full border border-brand/20">
                              <User size={12} className="text-brand" strokeWidth={2.5} />
                              <span className="text-[11px] font-bold text-brand truncate max-w-[150px]">{selectedCustomer.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Split Payment Manager */}
                      <div className="flex flex-col gap-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                          <label className="text-base font-black text-text-secondary pl-1">
                            Payments
                          </label>
                        </div>

                        {/* Credit / Pending Badge — full width, beneath label */}
                        {totalPaid < total && (
                          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                            isManufacturer
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : 'bg-rose-500/10 border-rose-500/20'
                          }`}>
                            <span className={`text-sm font-black ${
                              isManufacturer ? 'text-amber-600' : 'text-rose-500'
                            }`}>
                              {isManufacturer ? 'Credit / Advance' : 'Pending Balance'}
                            </span>
                            <span className={`text-sm font-black ${
                              isManufacturer ? 'text-amber-600' : 'text-rose-500'
                            }`}>
                              {formatCurrency(total - totalPaid)}
                            </span>
                          </div>
                        )}
                        {totalPaid >= total && (
                          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-sm font-black text-emerald-600">
                              {totalPaid > total ? 'Change Due' : 'Paid in Full'}
                            </span>
                            <span className="text-sm font-black text-emerald-600">
                              {totalPaid > total ? formatCurrency(totalPaid - total) : '✓'}
                            </span>
                          </div>
                        )}

                        {/* Payment Rows */}
                        <div className="flex flex-col gap-3">
                          {payments.map((pmt, index) => (
                            <div key={pmt.id} className="flex gap-2 items-center bg-surface-muted/20 p-2 rounded-[1.5rem] border border-glass-border/30 animate-in fade-in slide-in-from-right-2 duration-200">
                              <select 
                                value={pmt.method}
                                onChange={(e) => updatePayment(pmt.id, 'method', e.target.value)}
                                className="w-32 h-16 px-4 text-lg font-black rounded-2xl bg-surface border border-glass-border/50 outline-none text-text-main shadow-sm"
                              >
                                {[
                                  { id: 'cash', label: 'Cash' },
                                  { id: 'card', label: 'Card' },
                                  { id: 'bank', label: 'Bank' },
                                  { id: 'qr', label: 'QR' },
                                  { id: 'cheque', label: 'Cheque' }
                                ]
                                .filter(m => !activePaymentMethods || activePaymentMethods.includes(m.id))
                                .map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                              </select>

                              <div className="relative flex-1 bg-surface shadow-inner rounded-2xl border border-glass-border/50 h-16 flex items-center overflow-hidden">
                                <span className="pl-4 text-base font-black text-text-secondary opacity-60 select-none">{currentCurrency || 'LKR'}</span>
                                <input 
                                  type="number"
                                  placeholder="0.00"
                                  value={pmt.amount || ''}
                                  onChange={(e) => updatePayment(pmt.id, 'amount', e.target.value)}
                                  className="w-full h-full bg-transparent px-3 text-3xl font-black text-text-main outline-none placeholder:text-text-secondary/30"
                                />
                                {index === 0 && (
                                  <button 
                                    onClick={() => updatePayment(pmt.id, 'amount', Number((parseFloat(pmt.amount || 0) + (total - totalPaid)).toFixed(2)))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand bg-brand/10 px-3 py-1.5 rounded-xl hover:bg-brand/20 active:scale-95 transition-all"
                                  >
                                    MAX
                                  </button>
                                )}
                              </div>

                              {payments.length > 1 && (
                                <button onClick={() => removePayment(pmt.id)} className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 active:scale-90 transition-transform">
                                  <Trash2 size={20} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={addPayment}
                          className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-glass-border/40 rounded-2xl text-sm font-bold text-text-secondary active:scale-95 transition-all"
                        >
                          <Plus size={18} /> Add Payment
                        </button>
                      </div>

                      {/* Small Breakdown - High Density */}
                      <div className="space-y-4 border-t border-glass-border/30 pt-6 px-2 pb-2">
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-text-secondary font-black">{t('checkout.subtotal')}</span>
                          <span className="text-text-main font-black">{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-lg">
                            <span className="text-rose-500 font-black">{t('checkout.discount') || 'Discount'} ({discount}%)</span>
                            <span className="text-rose-500 font-black">- {formatCurrency(getDiscountAmount())}</span>
                          </div>
                        )}
                        {adjustment !== 0 && (
                          <div className="flex justify-between items-center text-lg">
                            <span className="text-brand font-black">{t('checkout.adjustment') || 'Adjustment'}</span>
                            <span className="text-brand font-black">{adjustment > 0 ? '+' : '-'} {formatCurrency(Math.abs(adjustment))}</span>
                          </div>
                        )}
                        {enableTax && ssclRate > 0 && (
                          <div className="flex justify-between items-center text-lg border-t border-glass-border/10 pt-4">
                            <span className="text-text-secondary font-black">SSCL ({ssclRate}%)</span>
                            <span className="text-text-main font-black">{formatCurrency(getSSCLAmount())}</span>
                          </div>
                        )}
                        {enableTax && vatRate > 0 && (
                          <div className="flex justify-between items-center text-lg border-t border-glass-border/10 pt-4">
                            <span className="text-text-secondary font-black">VAT ({vatRate}%)</span>
                            <span className="text-text-main font-black">{formatCurrency(getVATAmount())}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                        <span className="text-sm font-bold">{t('checkout.more')}</span>
                      </button>

                        {showActions && (
                          <>
                            <div 
                              className="fixed inset-0 z-[190]"
                              onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
                            />
                            <div className="absolute bottom-full left-0 w-48 bg-surface rounded-2xl shadow-2xl p-1.5 border border-glass-border mb-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
                              <button 
                                onClick={() => { haptics.medium(); handleFinish('draft'); setShowActions(false); }}
                                disabled={isSyncing}
                                className="w-full p-3 rounded-xl flex items-center gap-3 text-text-main hover:bg-brand/5 active:bg-brand/10 transition-colors disabled:opacity-50"
                              >
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                  <Plus size={16} strokeWidth={3} />
                                </div>
                                <span className="text-xs font-bold">Hold Sale</span>
                              </button>
                              <button 
                                onClick={() => { haptics.heavy(); clearCart(); handleClose(); setShowActions(false); }}
                                className="w-full p-3 rounded-xl flex items-center gap-3 text-rose-500 hover:bg-rose-500/5 active:bg-rose-500/10 transition-colors border-t border-glass-border/10 mt-1"
                              >
                                <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                  <Trash2 size={16} strokeWidth={3} />
                                </div>
                                <span className="text-xs font-bold">Clear Cart</span>
                              </button>
                            </div>
                          </>
                        )}
                    </>
                  ) : (
                    <div className="bg-surface border-2 border-brand/20 text-brand px-5 h-14 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="text-lg font-black text-brand">{formatCurrency(total)}</span>
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
                      <span className="text-sm font-black">{step === 1 ? (isManufacturer ? 'Distributor' : 'Customer') : 'Payment'}</span>
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
            {isSyncing && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-[150] flex flex-col items-center justify-center gap-4 rounded-t-[3rem] animate-in fade-in duration-200">
                <div className="h-16 w-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-black text-brand">Synchronizing Order</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
