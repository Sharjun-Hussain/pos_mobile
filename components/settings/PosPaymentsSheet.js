"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, CreditCard, Save, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash', sub: 'Physical currency' },
  { id: 'card', label: 'Card', sub: 'Debit & Credit' },
  { id: 'bank', label: 'Bank Transfer', sub: 'Direct deposit' },
  { id: 'qr', label: 'QR Pay', sub: 'Digital wallet' },
];

export const PosPaymentsSheet = memo(({ isOpen, onClose }) => {
  const { activePaymentMethods, updatePOSSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setMethods([...activePaymentMethods]);
      setSuccess(false);
    }
  }, [isOpen, activePaymentMethods]);

  const toggleMethod = useCallback((id) => {
    setMethods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    const res = await updatePOSSettings({ activePaymentMethods: methods });
    if (res.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    }
    setLoading(false);
  }, [methods, updatePOSSettings, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[90dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Payment Methods</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Gateway Configuration</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold text-text-secondary opacity-60 pl-2 border-l-2 border-brand ml-1">
                  Selected gateways appear in the checkout wizard.
                </p>
                {PAYMENT_OPTIONS.map(opt => {
                  const active = methods.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => { haptics.light(); toggleMethod(opt.id); }} className={`h-16 px-5 rounded-[1.5rem] border flex items-center justify-between transition-all active:scale-[0.98] mt-2 ${active ? 'border-brand/30 bg-brand/5' : 'border-glass-border/20 bg-surface-muted/50'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl transition-all ${active ? 'bg-brand text-white' : 'bg-surface text-text-secondary'}`}>
                          <CreditCard size={16} />
                        </div>
                        <div className="text-left">
                          <p className={`text-[14px] font-bold ${active ? 'text-brand' : 'text-text-main'}`}>{opt.label}</p>
                          <p className="text-[11px] text-text-secondary opacity-50">{opt.sub}</p>
                        </div>
                      </div>
                      <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-brand bg-brand' : 'border-glass-border/30'}`}>
                        {active && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-[calc(var(--sab)+1.5rem)] bg-gradient-to-t from-surface via-surface/95 to-transparent border-t border-glass-border/10">
              <button onClick={handleSave} disabled={loading || success} className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-70 ${success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-brand shadow-brand/20'}`}>
                {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : success ? <><Check size={18} strokeWidth={3} /> Settings Saved</> : <><Save size={17} /> Save Settings</>}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});
PosPaymentsSheet.displayName = 'PosPaymentsSheet';
