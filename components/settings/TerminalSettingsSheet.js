"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Volume2, 
  Printer, 
  FileText, 
  ShieldAlert, 
  Save, 
  CreditCard, 
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Percent,
  Hash
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

export const TerminalSettingsSheet = ({ isOpen, onClose, initialSection = 'terminal' }) => {
  const { 
    terminalName, 
    enableSound, 
    paperWidth, 
    headerText, 
    footerText, 
    refundPolicy,
    activePaymentMethods,
    showTaxBreakdown,
    checkoutPreview,
    updatePOSSettings,
    setTerminalSetting,
    vatRate,
    ssclRate,
    taxId,
    updateTaxSettings
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState(initialSection); // terminal, receipt, payments
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Local Form State
  const [form, setForm] = useState({
    terminalName: '',
    enableSound: true,
    showTaxBreakdown: false,
    checkoutPreview: true,
    paperWidth: '80mm',
    headerText: '',
    footerText: '',
    refundPolicy: '',
    activePaymentMethods: [],
    vatRate: 18,
    ssclRate: 2.5,
    taxId: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        terminalName,
        enableSound,
        showTaxBreakdown,
        checkoutPreview,
        paperWidth,
        headerText,
        footerText,
        refundPolicy,
        activePaymentMethods: [...activePaymentMethods],
        vatRate,
        ssclRate,
        taxId
      });
      setSuccess(false);
      setActiveTab(initialSection);
    }
  }, [isOpen, terminalName, enableSound, paperWidth, headerText, footerText, refundPolicy, activePaymentMethods, initialSection, vatRate, ssclRate, taxId]);

  const handleSave = async () => {
    setLoading(true);
    haptics.medium();
    
    // Save local-only settings first
    setTerminalSetting('terminalName', form.terminalName);
    
    // Sync modular settings with backend
    const res = await updatePOSSettings({
      enableSound: form.enableSound,
      showTaxBreakdown: form.showTaxBreakdown,
      checkoutPreview: form.checkoutPreview,
      paperWidth: form.paperWidth,
      headerText: form.headerText,
      footerText: form.footerText,
      refundPolicy: form.refundPolicy,
      activePaymentMethods: form.activePaymentMethods
    });

    // Save Tax Settings
    const taxRes = await updateTaxSettings({
      vatRate: parseFloat(form.vatRate),
      ssclRate: parseFloat(form.ssclRate),
      taxId: form.taxId
    });

    if (res.success && taxRes.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }
    setLoading(false);
  };

  const togglePaymentMethod = (id) => {
    setForm(prev => ({
      ...prev,
      activePaymentMethods: prev.activePaymentMethods.includes(id)
        ? prev.activePaymentMethods.filter(m => m !== id)
        : [...prev.activePaymentMethods, id]
    }));
  };

  const PAYMENT_OPTIONS = [
    { id: 'cash', label: 'Cash', icon: CreditCard },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'bank', label: 'Bank', icon: CreditCard },
    { id: 'qr', label: 'QR Pay', icon: CreditCard }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 1 }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] pb-6 shadow-2xl border-t border-glass-border pointer-events-auto flex flex-col max-h-[95vh]"
          >
            <div className="flex justify-center pb-4 pt-3">
              <div className="w-14 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-4 px-6 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">POS Configuration</h2>
                <p className="text-xs font-bold text-text-secondary opacity-40 mt-1">Terminal & Operational Basis</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 glass-panel border border-glass-border rounded-full flex items-center justify-center text-text-secondary">
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 px-6 mb-6">
              {[
                { id: 'terminal', label: 'Terminal', icon: Smartphone },
                { id: 'receipt', label: 'Receipt', icon: FileText },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'taxes', label: 'Taxes', icon: Percent }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { haptics.light(); setActiveTab(tab.id); }}
                  className={`flex-1 h-12 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id ? 'bg-brand text-white shadow-lg' : 'bg-surface-muted text-text-secondary border border-glass-border'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar min-h-[50vh]">
              {activeTab === 'terminal' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Terminal Hostname</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                      <input 
                        type="text"
                        value={form.terminalName}
                        onChange={(e) => setForm({...form, terminalName: e.target.value})}
                        className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-glass-border/30">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Volume2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">Haptic & Audio Basis</p>
                        <p className="text-[10px] font-bold text-text-secondary">Synthesize sounds on scan</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { haptics.light(); setForm({...form, enableSound: !form.enableSound}); }}
                      className={`h-8 w-14 rounded-full transition-all flex items-center px-1 ${form.enableSound ? 'bg-brand' : 'bg-surface-muted'}`}
                    >
                      <motion.div 
                        animate={{ x: form.enableSound ? 24 : 0 }}
                        className="h-6 w-6 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-glass-border/30">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">Checkout Preview</p>
                        <p className="text-[10px] font-bold text-text-secondary">Verify items before payment</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { haptics.light(); setForm({...form, checkoutPreview: !form.checkoutPreview}); }}
                      className={`h-8 w-14 rounded-full transition-all flex items-center px-1 ${form.checkoutPreview ? 'bg-brand' : 'bg-surface-muted'}`}
                    >
                      <motion.div 
                        animate={{ x: form.checkoutPreview ? 24 : 0 }}
                        className="h-6 w-6 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-glass-border/30">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">Tax Transparency</p>
                        <p className="text-[10px] font-bold text-text-secondary">Display breakdown in checkout</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { haptics.light(); setForm({...form, showTaxBreakdown: !form.showTaxBreakdown}); }}
                      className={`h-8 w-14 rounded-full transition-all flex items-center px-1 ${form.showTaxBreakdown ? 'bg-brand' : 'bg-surface-muted'}`}
                    >
                      <motion.div 
                        animate={{ x: form.showTaxBreakdown ? 24 : 0 }}
                        className="h-6 w-6 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'receipt' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Paper Dimension Basis</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['80mm', '58mm'].map(size => (
                        <button
                          key={size}
                          onClick={() => { haptics.light(); setForm({...form, paperWidth: size}); }}
                          className={`h-14 rounded-2xl border-2 font-bold text-sm transition-all ${
                            form.paperWidth === size ? 'border-brand bg-brand/5 text-brand' : 'border-glass-border bg-surface-muted text-text-secondary'
                          }`}
                        >
                          {size} Thermal
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Receipt Header (Custom Title)</label>
                    <input 
                      type="text"
                      placeholder="Leave blank for business name"
                      value={form.headerText}
                      onChange={(e) => setForm({...form, headerText: e.target.value})}
                      className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl px-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Footer Message</label>
                    <textarea 
                      rows={2}
                      value={form.footerText}
                      onChange={(e) => setForm({...form, footerText: e.target.value})}
                      className="w-full p-4 bg-surface-muted border border-glass-border rounded-2xl text-base font-bold text-text-main outline-none focus:border-brand/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Refund & Return Policy</label>
                    <textarea 
                      rows={3}
                      value={form.refundPolicy}
                      onChange={(e) => setForm({...form, refundPolicy: e.target.value})}
                      className="w-full p-4 bg-surface-muted border border-glass-border rounded-2xl text-base font-bold text-text-main outline-none focus:border-brand/40"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] font-bold text-text-secondary opacity-60 px-1 border-l-2 border-brand ml-1 pl-3">
                    Selected protocols will appear in the checkout wizard.
                  </p>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { haptics.light(); togglePaymentMethod(opt.id); }}
                        className={`h-16 px-6 rounded-3xl border flex items-center justify-between transition-all ${
                          form.activePaymentMethods.includes(opt.id) 
                            ? 'border-brand bg-brand/5 shadow-sm shadow-brand/5' 
                            : 'border-glass-border bg-surface-muted'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${form.activePaymentMethods.includes(opt.id) ? 'bg-brand text-white' : 'bg-surface text-text-secondary'}`}>
                            <opt.icon size={18} />
                          </div>
                          <span className={`font-bold ${form.activePaymentMethods.includes(opt.id) ? 'text-brand' : 'text-text-main'}`}>{opt.label}</span>
                        </div>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          form.activePaymentMethods.includes(opt.id) ? 'border-brand bg-brand' : 'border-glass-border'
                        }`}>
                          {form.activePaymentMethods.includes(opt.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'taxes' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-brand/5 border border-brand/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-1">Sri Lankan Compliance</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Configuration for VAT (Value Added Tax) and SSCL (Social Security Contribution Levy) as per legal requirements.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1">Taxpayer Identification Number (TIN)</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                      <input 
                        type="text"
                        placeholder="e.g. 123456789-0000"
                        value={form.taxId}
                        onChange={(e) => setForm({...form, taxId: e.target.value})}
                        className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary pl-1">VAT Rate (%)</label>
                      <div className="relative">
                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <input 
                          type="number"
                          value={form.vatRate}
                          onChange={(e) => setForm({...form, vatRate: e.target.value})}
                          className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary pl-1">SSCL Rate (%)</label>
                      <div className="relative">
                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <input 
                          type="number"
                          value={form.ssclRate}
                          onChange={(e) => setForm({...form, ssclRate: e.target.value})}
                          className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl border-glass-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-text-main">Effective Tax Rate</p>
                      <p className="text-lg font-black text-brand">
                        {(parseFloat(form.ssclRate || 0) + (1 + parseFloat(form.ssclRate || 0)/100) * parseFloat(form.vatRate || 0)).toFixed(2)}%
                      </p>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Calculated as: SSCL + (Base + SSCL) × VAT. This matches the Sri Lankan Inland Revenue calculation for compound taxes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-4 bg-gradient-to-t from-surface via-surface to-transparent border-t border-glass-border/20">
              <button 
                onClick={handleSave}
                disabled={loading || success}
                className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-brand/20 ${
                  success ? 'bg-emerald-500' : 'bg-brand'
                }`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <><Check size={20} strokeWidth={3} /> Changes Persisted</>
                ) : (
                  <><Save size={18} /> Save Settings</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
