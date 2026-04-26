"use client";

import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { 
  Lock, 
  Coins, 
  CheckCircle2, 
  AlertTriangle,
  LogOut,
  Calculator,
  Wallet
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useShiftStore } from '@/store/useShiftStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export const ShiftManagerSheet = ({ isOpen, forceOpen, onClose }) => {
  useHardwareBack(isOpen && !forceOpen, onClose);
  const { activeShift, setShift, clearShift } = useShiftStore();
  const { logout, selectedBranch } = useAuthStore();
  
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // If activeShift is null, we are OPENING. If it has data, we are CLOSING.
  const isOpening = !activeShift;

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError(null);
    }
  }, [isOpen, isOpening]);

  const currentVal = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    haptics.medium();

    try {
      if (isOpening) {
        const res = await api.shifts.open({ 
          opening_cash: currentVal,
          branch_id: selectedBranch?.id
        });
        if (res.status === 'success') {
          setShift(res.data);
          haptics.heavy();
          if (onClose) onClose();
        }
      } else {
        const res = await api.shifts.close(activeShift.id, { closing_cash: currentVal });
        if (res.status === 'success') {
          clearShift();
          haptics.heavy();
          if (onClose) onClose();
        }
      }
    } catch (err) {
      haptics.error();
      setError(err.message || 'Failed to process shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If forceOpen is true, the user CANNOT dismiss.
  return (
    <Drawer.Root 
      open={isOpen || forceOpen} 
      onOpenChange={(open) => {
        if (!forceOpen && !open && onClose) onClose();
      }}
      dismissible={!forceOpen}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl max-h-[90dvh]">
          {!forceOpen && <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />}
          {forceOpen && <div className="mt-8" />}
          
          <div className="flex flex-col h-full overflow-hidden p-6 pb-[calc(var(--sab)+1rem)]">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4 text-brand">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl ${isOpening ? 'bg-brand/10 shadow-brand/20' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/20'}`}>
                  {isOpening ? <Wallet size={28} strokeWidth={2.5} /> : <Calculator size={28} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-text-main tracking-tight">
                    {isOpening ? 'Open Shift' : 'Close Shift (Z-Read)'}
                  </h2>
                  <p className="text-sm font-bold text-text-secondary opacity-60">
                    {isOpening ? 'Record starting float / base' : 'Enter final cash count'}
                  </p>
                </div>
              </div>

              {/* Force Open (Must Log Out instead of closing drawer) */}
              {forceOpen && isOpening && (
                <button 
                  onClick={() => logout()}
                  className="h-12 px-4 bg-surface-muted rounded-xl flex items-center gap-2 text-text-secondary active:scale-95 transition-transform"
                >
                  <LogOut size={18} />
                  <span className="text-xs font-bold hidden sm:inline">Logout</span>
                </button>
              )}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-starts gap-3 text-rose-500 mb-6">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold py-0.5 leading-snug">{error}</p>
              </div>
            )}

            {/* Usual Form Input */}
            <div className="flex flex-col gap-2 mb-8">
              <label 
                htmlFor="cash-input"
                className="text-[10px] font-bold text-text-secondary ml-1 opacity-50"
              >
                {isOpening ? 'Starting Cash Float' : 'Ending Cash Count'}
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-text-secondary opacity-40 group-focus-within:text-brand transition-colors">LKR</div>
                <input
                  id="cash-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => haptics.light()}
                  className="w-full h-14 pl-16 pr-5 bg-surface-muted border border-glass-border/30 rounded-[1.25rem] text-base font-bold text-text-main focus:border-brand/50 focus:bg-surface outline-none transition-all shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Action */}
            <button 
              disabled={isSubmitting || (!amount && !isOpening)} // Allow 0 for opening, but require entry for closing? Or maybe default to 0
              onClick={handleSubmit}
              className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 border shadow-sm ${isOpening ? 'bg-surface border-brand/20 text-brand' : 'bg-surface border-rose-500/20 text-rose-500'}`}
            >
              {isSubmitting ? (
                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                  <span className="text-[17px] font-bold">
                    {isOpening ? 'Confirm & Open' : 'Confirm & Close'}
                  </span>
                </>
              )}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
