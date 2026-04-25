"use client";

import React, { memo, useCallback } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useHardwareBack } from '@/hooks/useHardwareBack';

const CURRENCIES = [
  { id: 'LKR', label: 'Sri Lankan Rupee', symbol: '₨', sub: 'Default' },
  { id: 'USD', label: 'US Dollar', symbol: '$', sub: 'International' },
  { id: 'EUR', label: 'Euro', symbol: '€', sub: 'European Union' },
  { id: 'GBP', label: 'British Pound', symbol: '£', sub: 'United Kingdom' },
  { id: 'SAR', label: 'Saudi Riyal', symbol: '﷼', sub: 'Middle East' },
  { id: 'AED', label: 'UAE Dirham', symbol: 'د.إ', sub: 'United Arab Emirates' }
];

export const CurrencySelectionSheet = memo(({ isOpen, onClose }) => {
  useHardwareBack(isOpen, onClose);
  const { currency, setCurrency } = useSettingsStore();

  const handleSelect = useCallback((code) => {
    haptics.medium();
    setCurrency(code);
    setTimeout(onClose, 250);
  }, [setCurrency, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl max-h-[90dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-8 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Currency</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">
                  Billing Basis
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-[calc(var(--sab)+2rem)]">
              <div className="flex flex-col gap-2 mt-2 mb-6">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.id}
                    onClick={() => handleSelect(curr.id)}
                    className={`w-full p-4 rounded-[1.5rem] border flex items-center justify-between transition-all active:scale-[0.98] ${
                      currency === curr.id
                        ? 'border-brand/30 bg-brand/5'
                        : 'border-glass-border/20 bg-surface-muted/50 hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm transition-all ${
                        currency === curr.id ? 'bg-brand text-white shadow-brand/20' : 'bg-surface text-text-secondary'
                      }`}>
                        {curr.symbol}
                      </div>
                      <div className="text-left">
                        <p className={`text-[14px] font-bold leading-tight ${currency === curr.id ? 'text-brand' : 'text-text-main'}`}>
                          {curr.label}
                        </p>
                        <p className="text-[11px] font-medium text-text-secondary opacity-50 uppercase tracking-wide mt-0.5">
                          {curr.id} · {curr.sub}
                        </p>
                      </div>
                    </div>
                    {currency === curr.id ? (
                      <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 animate-in zoom-in duration-200">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary opacity-20" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

CurrencySelectionSheet.displayName = 'CurrencySelectionSheet';
