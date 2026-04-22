"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X, Smartphone, Volume2, Printer, FileText, ShieldAlert,
  Save, CreditCard, Check, Percent, Hash
} from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

// Lightweight CSS toggle — no Framer Motion needed
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

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash', sub: 'Physical currency' },
  { id: 'card', label: 'Card', sub: 'Debit & Credit' },
  { id: 'bank', label: 'Bank Transfer', sub: 'Direct deposit' },
  { id: 'qr', label: 'QR Pay', sub: 'Digital wallet' },
];

const TABS = [
  { id: 'terminal', label: 'Terminal', icon: Smartphone },
  { id: 'receipt', label: 'Receipt', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'taxes', label: 'Taxes', icon: Percent },
];

export const TerminalSettingsSheet = memo(({ isOpen, onClose, initialSection = 'terminal' }) => {
  const {
    terminalName, enableSound, showLogo, paperWidth, headerText, footerText,
    refundPolicy, activePaymentMethods, showTaxBreakdown, checkoutPreview,
    updatePOSSettings, setTerminalSetting, vatRate, ssclRate, taxId, updateTaxSettings
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState(initialSection);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    terminalName: '', enableSound: true, showLogo: false, showTaxBreakdown: false,
    checkoutPreview: true, paperWidth: '80mm', headerText: '', footerText: '',
    refundPolicy: '', activePaymentMethods: [], vatRate: 18, ssclRate: 2.5, taxId: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        terminalName, enableSound, showLogo, showTaxBreakdown, checkoutPreview,
        paperWidth, headerText, footerText, refundPolicy,
        activePaymentMethods: [...activePaymentMethods],
        vatRate, ssclRate, taxId
      });
      setSuccess(false);
      setActiveTab(initialSection);
    }
  }, [isOpen, terminalName, enableSound, paperWidth, headerText, footerText, refundPolicy,
      activePaymentMethods, initialSection, vatRate, ssclRate, taxId, showLogo, showTaxBreakdown, checkoutPreview]);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    setTerminalSetting('terminalName', form.terminalName);
    const res = await updatePOSSettings({
      enableSound: form.enableSound, showLogo: form.showLogo, showTaxBreakdown: form.showTaxBreakdown,
      checkoutPreview: form.checkoutPreview, paperWidth: form.paperWidth, headerText: form.headerText,
      footerText: form.footerText, refundPolicy: form.refundPolicy, activePaymentMethods: form.activePaymentMethods
    });
    const taxRes = await updateTaxSettings({
      vatRate: parseFloat(form.vatRate), ssclRate: parseFloat(form.ssclRate), taxId: form.taxId
    });
    if (res.success && taxRes.success) {
      haptics.heavy();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    }
    setLoading(false);
  }, [form, setTerminalSetting, updatePOSSettings, updateTaxSettings, onClose]);

  const togglePaymentMethod = useCallback((id) => {
    setForm(prev => ({
      ...prev,
      activePaymentMethods: prev.activePaymentMethods.includes(id)
        ? prev.activePaymentMethods.filter(m => m !== id)
        : [...prev.activePaymentMethods, id]
    }));
  }, []);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[95dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">POS Configuration</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Terminal & Operational Basis</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            {/* Segmented Tab Control */}
            <div className="px-8 mb-6">
              <div className="flex bg-surface-muted p-1.5 rounded-2xl gap-1 border border-glass-border/20">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { haptics.light(); setActiveTab(tab.id); }}
                    className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-surface text-brand shadow-md shadow-black/5'
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-[11px]">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              {activeTab === 'terminal' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
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
              )}

              {activeTab === 'receipt' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <ToggleRow icon={Smartphone} color="bg-brand/10 text-brand" label="Show Business Logo" desc="Display branding on receipt" enabled={form.showLogo} onToggle={() => setField('showLogo', !form.showLogo)} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Paper Dimension</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['80mm', '58mm'].map(size => (
                        <button
                          key={size}
                          onClick={() => { haptics.light(); setField('paperWidth', size); }}
                          className={`h-14 rounded-2xl border-2 font-bold text-[13px] transition-all ${
                            form.paperWidth === size ? 'border-brand bg-brand/5 text-brand' : 'border-glass-border/30 bg-surface-muted text-text-secondary'
                          }`}
                        >
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
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                          className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                        />
                      ) : (
                        <textarea
                          rows={rows}
                          placeholder={placeholder}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                          className="w-full p-4 bg-surface-muted border border-glass-border/30 rounded-2xl text-[14px] font-medium text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all resize-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                  <p className="text-[11px] font-bold text-text-secondary opacity-60 pl-2 border-l-2 border-brand ml-1">
                    Selected gateways appear in the checkout wizard.
                  </p>
                  {PAYMENT_OPTIONS.map(opt => {
                    const active = form.activePaymentMethods.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { haptics.light(); togglePaymentMethod(opt.id); }}
                        className={`h-16 px-5 rounded-[1.5rem] border flex items-center justify-between transition-all active:scale-[0.98] ${
                          active ? 'border-brand/30 bg-brand/5' : 'border-glass-border/20 bg-surface-muted/50'
                        }`}
                      >
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
              )}

              {activeTab === 'taxes' && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
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
                      <input
                        type="text"
                        placeholder="e.g. 123456789-0000"
                        value={form.taxId}
                        onChange={(e) => setField('taxId', e.target.value)}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: 'vatRate', label: 'VAT Rate (%)' }, { key: 'ssclRate', label: 'SSCL Rate (%)' }].map(({ key, label }) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">{label}</label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={15} />
                          <input
                            type="number"
                            value={form[key]}
                            onChange={(e) => setField(key, e.target.value)}
                            className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-9 pr-3 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                          />
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
              )}
            </div>

            {/* Save Bar */}
            <div className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-[calc(var(--sab)+1.5rem)] bg-gradient-to-t from-surface via-surface/95 to-transparent border-t border-glass-border/10">
              <button
                onClick={handleSave}
                disabled={loading || success}
                className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-70 ${
                  success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-brand shadow-brand/20'
                }`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <><Check size={18} strokeWidth={3} /> Settings Saved</>
                ) : (
                  <><Save size={17} /> Save Settings</>
                )}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

TerminalSettingsSheet.displayName = 'TerminalSettingsSheet';
