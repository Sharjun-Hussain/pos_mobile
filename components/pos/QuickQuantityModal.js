"use client";

import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, Minus, Plus, Check } from 'lucide-react';
import { haptics } from '@/services/haptics';

export const QuickQuantityModal = ({ isOpen, onClose, product, onAdd }) => {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (isOpen) setQty(1);
  }, [isOpen]);

  const handleAdd = () => {
    haptics.heavy();
    onAdd(product, qty);
    onClose();
  };

  const adjustQty = (amount) => {
    haptics.light();
    setQty(prev => Math.max(1, prev + amount));
  };

  if (!product) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 z-[101] outline-none shadow-2xl pb-[calc(var(--sab)+2rem)]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          
          <div className="flex flex-col px-6 pt-2 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-text-main leading-tight">{product.name || product.fullName}</h3>
                <p className="text-xs font-bold text-text-secondary opacity-60 mt-1">Enter Quantity</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-rose-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 my-6">
              <button onClick={() => adjustQty(-1)} className="h-16 w-16 rounded-2xl glass-panel bg-surface-muted/30 border-glass-border/40 flex items-center justify-center text-text-secondary active:scale-95 transition-all">
                <Minus size={24} strokeWidth={3} />
              </button>
              
              <div className="flex-1 max-w-[120px]">
                <input 
                  type="number" 
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-16 bg-transparent text-center text-4xl font-black text-text-main outline-none border-b-2 border-brand/20 focus:border-brand transition-colors"
                />
              </div>

              <button onClick={() => adjustQty(1)} className="h-16 w-16 rounded-2xl glass-panel bg-brand/10 border-brand/20 flex items-center justify-center text-brand active:scale-95 transition-all">
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8">
                {[6, 12, 24, 50].map(val => (
                  <button 
                    key={val}
                    onClick={() => { haptics.light(); setQty(val); }}
                    className="h-12 rounded-xl bg-surface-muted/30 border border-glass-border/30 text-sm font-bold text-text-secondary active:bg-brand/10 active:text-brand transition-colors"
                  >
                    {val}
                  </button>
                ))}
            </div>

            <button 
              onClick={handleAdd}
              className="w-full h-14 bg-brand text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-brand/20"
            >
              <Check size={20} strokeWidth={3} />
              Add to Cart
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
