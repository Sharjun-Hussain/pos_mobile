"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Printer, Save, Check, Wifi, Loader2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';
import LanPrinter from '@/services/LanPrinter';
import { EscPosEncoder } from '@/services/esc-pos';
import { useHardwareBack } from '@/hooks/useHardwareBack';

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

export const PosLanPrinterSheet = memo(({ isOpen, onClose }) => {
  useHardwareBack(isOpen, onClose);
  const { useLanPrinter, printerIp, printerPort, setLanPrinterSetting } = useSettingsStore();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ useLanPrinter: false, printerIp: '', printerPort: 9100 });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ useLanPrinter, printerIp, printerPort });
      setSuccess(false);
      setTestStatus(null);
      setPrintStatus(null);
    }
  }, [isOpen, useLanPrinter, printerIp, printerPort]);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    
    setLanPrinterSetting({
      useLanPrinter: form.useLanPrinter,
      printerIp: form.printerIp,
      printerPort: form.printerPort || 9100
    });
    
    haptics.heavy();
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    setLoading(false);
  }, [form, setLanPrinterSetting, onClose]);

  const handleTestConnection = async () => {
    if (!form.printerIp) {
      setTestStatus({ success: false, message: 'Please enter an IP address' });
      return;
    }
    
    setIsTestingConnection(true);
    setTestStatus(null);
    
    try {
      const result = await LanPrinter.connect({ ip: form.printerIp, port: parseInt(form.printerPort) || 9100 });
      if (result.success) {
        setTestStatus({ success: true, message: 'Connection successful!' });
        haptics.success();
      } else {
        setTestStatus({ success: false, message: 'Connection failed.' });
        haptics.error();
      }
    } catch (error) {
      setTestStatus({ success: false, message: error.message || 'Connection failed.' });
      haptics.error();
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestPrint = async () => {
    if (!form.printerIp) {
      setPrintStatus({ success: false, message: 'Please enter an IP address' });
      return;
    }
    
    setIsTestingPrint(true);
    setPrintStatus(null);
    
    try {
      const encoder = new EscPosEncoder();
      encoder
        .initialize()
        .align('center')
        .bold(true)
        .size(2, 2)
        .line('TEST PRINT')
        .bold(false)
        .size(1, 1)
        .newline()
        .line('If you can read this,')
        .line('your LAN printer is working!')
        .newline()
        .divider()
        .newline()
        .align('left')
        .line(`IP: ${form.printerIp}`)
        .line(`Port: ${form.printerPort || 9100}`)
        .cut();
        
      const data = encoder.encode();
      
      const result = await LanPrinter.print({ ip: form.printerIp, port: parseInt(form.printerPort) || 9100, data });
      if (result.success) {
        setPrintStatus({ success: true, message: 'Print sent successfully!' });
        haptics.success();
      } else {
        setPrintStatus({ success: false, message: 'Print failed.' });
        haptics.error();
      }
    } catch (error) {
      setPrintStatus({ success: false, message: error.message || 'Print failed.' });
      haptics.error();
    } finally {
      setIsTestingPrint(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[95dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">LAN Printer</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Network ESC/POS</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              <div className="flex flex-col gap-4">
                <ToggleRow 
                  icon={Printer} 
                  color="bg-brand/10 text-brand" 
                  label="Enable LAN Printing" 
                  desc="Direct TCP socket to network printer" 
                  enabled={form.useLanPrinter} 
                  onToggle={() => setField('useLanPrinter', !form.useLanPrinter)} 
                />
                
                {form.useLanPrinter && (
                  <>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Printer IP Address</label>
                      <div className="relative">
                        <Wifi size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                        <input 
                          type="text" 
                          placeholder="e.g. 192.168.1.87" 
                          value={form.printerIp} 
                          onChange={(e) => setField('printerIp', e.target.value)} 
                          className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Port (Default 9100)</label>
                      <input 
                        type="number" 
                        placeholder="9100" 
                        value={form.printerPort} 
                        onChange={(e) => setField('printerPort', e.target.value)} 
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all" 
                      />
                    </div>
                    
                    <div className="flex gap-3 mt-2">
                      <button 
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !form.printerIp}
                        className="flex-1 h-12 bg-surface-muted border border-glass-border/30 rounded-[1.25rem] flex items-center justify-center gap-2 text-[13px] font-bold text-text-main active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isTestingConnection ? <Loader2 size={16} className="animate-spin text-brand" /> : <Wifi size={16} className="text-brand" />}
                        Test Connect
                      </button>
                      <button 
                        onClick={handleTestPrint}
                        disabled={isTestingPrint || !form.printerIp}
                        className="flex-1 h-12 bg-surface-muted border border-glass-border/30 rounded-[1.25rem] flex items-center justify-center gap-2 text-[13px] font-bold text-text-main active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isTestingPrint ? <Loader2 size={16} className="animate-spin text-brand" /> : <Printer size={16} className="text-brand" />}
                        Test Print
                      </button>
                    </div>

                    {testStatus && (
                      <div className={`p-3 rounded-xl text-[12px] font-medium flex items-center gap-2 mt-2 ${testStatus.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        {testStatus.success ? <Check size={14} /> : <X size={14} />}
                        {testStatus.message}
                      </div>
                    )}

                    {printStatus && (
                      <div className={`p-3 rounded-xl text-[12px] font-medium flex items-center gap-2 mt-1 ${printStatus.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        {printStatus.success ? <Check size={14} /> : <X size={14} />}
                        {printStatus.message}
                      </div>
                    )}
                  </>
                )}
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
PosLanPrinterSheet.displayName = 'PosLanPrinterSheet';
