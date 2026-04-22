"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Percent, Hash, Save, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

export const PosTaxesSheet = memo(({ isOpen, onClose }) => {
  const { vatRate, ssclRate, taxId, updateTaxSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ vatRate: 18, ssclRate: 2.5, taxId: '' });

  useEffect(() => {
    if (isOpen) {
      setForm({ vatRate, ssclRate, taxId });
      setSuccess(false);
    }
  }, [isOpen, vatRate, ssclRate, taxId]);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    const res = await updateTaxSettings({
      vatRate: parseFloat(form.vatRate),
      ssclRate: parseFloat(form.ssclRate),
      taxId: form.taxId
    });
    if (res.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    }
    setLoading(false);
  }, [form, updateTaxSettings, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[90dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Tax Settings</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Compliance & Rates</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              <div className="flex flex-col gap-5">
                <div className="bg-brand/5 border border-brand/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1.5">Sri Lankan Compliance</p>
                  <p className="text-[12px] font-medium text-text-secondary leading-relaxed">
                    Configure VAT and SSCL as required by the Inland Revenue Department.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Taxpayer ID (TIN)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={17} />
                    <input type="text" placeholder="e.g. 123456789-0000" value={form.taxId} onChange={(e) => setField('taxId', e.target.value)} className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[{ key: 'vatRate', label: 'VAT Rate (%)' }, { key: 'ssclRate', label: 'SSCL Rate (%)' }].map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">{label}</label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={15} />
                        <input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-9 pr-3 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] border-glass-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-bold text-text-main">Effective Tax Rate</p>
                    <p className="text-xl font-black text-brand">
                      {(parseFloat(form.ssclRate || 0) + (1 + parseFloat(form.ssclRate || 0) / 100) * parseFloat(form.vatRate || 0)).toFixed(2)}%
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary opacity-50 leading-relaxed">
                    SSCL + (Base + SSCL) × VAT. Compound rate per IRD standards.
                  </p>
                </div>
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
PosTaxesSheet.displayName = 'PosTaxesSheet';
