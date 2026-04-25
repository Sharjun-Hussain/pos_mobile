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

export const ShiftManagerSheet = ({ isOpen, forceOpen, onClose }) => {
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

  // Clean keypad input
  const handleKeypadSubmit = (value) => {
    haptics.light();
    if (value === 'C') {
      setAmount('');
    } else if (value === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else if (value === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      setAmount(prev => {
        const parts = prev.split('.');
        if (parts[1] && parts[1].length >= 2) return prev; // Limit to 2 decimals
        return prev + value;
      });
    }
  };

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
                  <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Logout</span>
                </button>
              )}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-starts gap-3 text-rose-500 mb-6">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold py-0.5 leading-snug">{error}</p>
              </div>
            )}

            {/* Display Input */}
            <div className="bg-surface-muted rounded-3xl p-6 flex flex-col items-center justify-center mb-6 relative overflow-hidden group border border-glass-border/20 shadow-inner">
              <span className="text-sm font-black text-text-secondary uppercase tracking-widest mb-2 opacity-50">
                {isOpening ? 'Opening Cash Float' : 'Actual Cash Count'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-text-secondary opacity-40">LKR</span>
                <span className={`text-6xl tracking-tighter ${amount ? 'font-black text-text-main' : 'font-medium text-text-secondary opacity-20'}`}>
                  {amount || '0.00'}
                </span>
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleKeypadSubmit(btn)}
                  className="h-16 bg-surface border border-glass-border/30 rounded-2xl flex items-center justify-center text-2xl font-black text-text-main active:scale-95 transition-transform active:bg-brand/10 active:text-brand shadow-sm"
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Action */}
            <button 
              disabled={isSubmitting || (!amount && !isOpening)} // Allow 0 for opening, but require entry for closing? Or maybe default to 0
              onClick={handleSubmit}
              className={`w-full h-16 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 ${isOpening ? 'bg-brand shadow-brand/30' : 'bg-rose-500 shadow-rose-500/30'}`}
            >
              {isSubmitting ? (
                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                  <span className="text-[17px] font-black uppercase tracking-widest">
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
