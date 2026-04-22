"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Smartphone, Save, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

const Toggle = memo(({ enabled, onToggle }) => (
  <button onClick={() => { haptics.light(); onToggle(); }} className={`h-8 w-14 rounded-full transition-all duration-200 flex items-center px-1 flex-shrink-0 ${enabled ? 'bg-brand' : 'bg-surface-muted border border-glass-border/30'}`}>
    <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
));
Toggle.displayName = 'Toggle';

const ToggleRow = memo(({ icon: Icon, color, label, desc, enabled, onToggle }) => (
  <div className="glass-panel p-4 rounded-[1.5rem] flex items-center justify-between border-glass-border/20 gap-4">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-text-main leading-tight">{label}</p>
        <p className="text-[11px] font-medium text-text-secondary opacity-50 mt-0.5">{desc}</p>
      </div>
    </div>
    <Toggle enabled={enabled} onToggle={onToggle} />
  </div>
));
ToggleRow.displayName = 'ToggleRow';

export const PosReceiptSheet = memo(({ isOpen, onClose }) => {
  const { showLogo, paperWidth, headerText, footerText, refundPolicy, updatePOSSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ showLogo: false, paperWidth: '80mm', headerText: '', footerText: '', refundPolicy: '' });

  useEffect(() => {
    if (isOpen) {
      setForm({ showLogo, paperWidth, headerText, footerText, refundPolicy });
      setSuccess(false);
    }
  }, [isOpen, showLogo, paperWidth, headerText, footerText, refundPolicy]);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    const res = await updatePOSSettings({
      showLogo: form.showLogo,
      paperWidth: form.paperWidth,
      headerText: form.headerText,
      footerText: form.footerText,
      refundPolicy: form.refundPolicy
    });
    if (res.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    }
    setLoading(false);
  }, [form, updatePOSSettings, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[95dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Receipt Policy</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Printer & Branding</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              <div className="flex flex-col gap-4">
                <ToggleRow icon={Smartphone} color="bg-brand/10 text-brand" label="Show Business Logo" desc="Display branding on receipt" enabled={form.showLogo} onToggle={() => setField('showLogo', !form.showLogo)} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Paper Dimension</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['80mm', '58mm'].map(size => (
                      <button key={size} onClick={() => { haptics.light(); setField('paperWidth', size); }} className={`h-14 rounded-2xl border-2 font-bold text-[13px] transition-all ${form.paperWidth === size ? 'border-brand bg-brand/5 text-brand' : 'border-glass-border/30 bg-surface-muted text-text-secondary'}`}>
                        {size} Thermal
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { key: 'headerText', label: 'Receipt Header', placeholder: 'Leave blank for business name', rows: 1 },
                  { key: 'footerText', label: 'Footer Message', placeholder: 'Thank you for your business!', rows: 2 },
                  { key: 'refundPolicy', label: 'Refund & Return Policy', placeholder: 'Enter your policy text...', rows: 3 },
                ].map(({ key, label, placeholder, rows }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">{label}</label>
                    {rows === 1 ? (
                      <input type="text" placeholder={placeholder} value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all" />
                    ) : (
                      <textarea rows={rows} placeholder={placeholder} value={form[key]} onChange={(e) => setField(key, e.target.value)} className="w-full p-4 bg-surface-muted border border-glass-border/30 rounded-2xl text-[14px] font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all resize-none" />
                    )}
                  </div>
                ))}
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
PosReceiptSheet.displayName = 'PosReceiptSheet';
