"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Smartphone, Volume2, FileText, ShieldAlert, Save, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

const Toggle = memo(({ enabled, onToggle }) => (
  <button
    onClick={() => { haptics.light(); onToggle(); }}
    className={`h-8 w-14 rounded-full transition-all duration-200 flex items-center px-1 flex-shrink-0 ${enabled ? 'bg-brand' : 'bg-surface-muted border border-glass-border/30'}`}
  >
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

export const PosTerminalSheet = memo(({ isOpen, onClose }) => {
  const {
    terminalName, enableSound, checkoutPreview, showTaxBreakdown,
    setTerminalSetting, updatePOSSettings
  } = useSettingsStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ terminalName: '', enableSound: true, checkoutPreview: true, showTaxBreakdown: false });

  useEffect(() => {
    if (isOpen) {
      setForm({ terminalName, enableSound, checkoutPreview, showTaxBreakdown });
      setSuccess(false);
    }
  }, [isOpen, terminalName, enableSound, checkoutPreview, showTaxBreakdown]);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    setTerminalSetting('terminalName', form.terminalName);
    const res = await updatePOSSettings({
      enableSound: form.enableSound,
      checkoutPreview: form.checkoutPreview,
      showTaxBreakdown: form.showTaxBreakdown
    });
    if (res.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    }
    setLoading(false);
  }, [form, setTerminalSetting, updatePOSSettings, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[90dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Terminal Config</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Hardware & Operational</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Terminal Hostname</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                    <input
                      type="text"
                      value={form.terminalName}
                      onChange={(e) => setField('terminalName', e.target.value)}
                      className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                    />
                  </div>
                </div>
                <ToggleRow icon={Volume2} color="bg-blue-500/10 text-blue-500" label="Haptic & Audio" desc="Synthesize sounds on scan" enabled={form.enableSound} onToggle={() => setField('enableSound', !form.enableSound)} />
                <ToggleRow icon={FileText} color="bg-orange-500/10 text-orange-500" label="Checkout Preview" desc="Verify items before payment" enabled={form.checkoutPreview} onToggle={() => setField('checkoutPreview', !form.checkoutPreview)} />
                <ToggleRow icon={ShieldAlert} color="bg-indigo-500/10 text-indigo-500" label="Tax Transparency" desc="Display breakdown in checkout" enabled={form.showTaxBreakdown} onToggle={() => setField('showTaxBreakdown', !form.showTaxBreakdown)} />
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
PosTerminalSheet.displayName = 'PosTerminalSheet';
