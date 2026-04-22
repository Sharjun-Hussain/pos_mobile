"use client";

import React, { memo } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';

export const VariantSelector = memo(({ product, isOpen, onClose, onSelect }) => {
  if (!product) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 z-[101] outline-none shadow-2xl max-h-[85dvh] pb-[calc(var(--sab)+1rem)]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          
          <div className="flex flex-col h-full overflow-hidden px-5 pb-2">
            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-[1.25rem] bg-brand/10 flex items-center justify-center overflow-hidden border border-brand/20 shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-brand" />
                  )}
                </div>
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-bold text-text-main leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-[11px] text-text-secondary font-bold opacity-60 uppercase tracking-widest mt-1">Select a variation</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 no-scrollbar flex-1 pb-4 overscroll-contain">
              <div className="grid grid-cols-2 gap-2">
                {product.variants?.map((v) => (
                  <button
                    key={v.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.medium();
                      onSelect(v);
                      onClose();
                    }}
                    className="glass-panel p-3.5 rounded-[1.25rem] flex flex-col items-start gap-1.5 text-left active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30 group relative bg-surface-muted/30"
                  >
                    <span className="font-bold text-text-main text-[13px] leading-snug line-clamp-2 w-full pr-6">
                      {v.variantName || 'Default'}
                    </span>
                    <span className="text-[12px] font-black text-brand tracking-tight mt-auto pt-1">
                      LKR {parseFloat(v.retailPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-text-secondary font-medium font-mono opacity-50 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full mt-0.5 w-max">
                      {v.barcode || 'No SKU'}
                    </span>
                    
                    <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center opacity-40 group-active:opacity-100 transition-all">
                      <Plus className="h-4 w-4 text-brand" strokeWidth={3} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 mt-auto">
              <button 
                onClick={() => { haptics.light(); onClose(); }}
                className="w-full h-12 rounded-2xl text-[14px] font-bold text-text-secondary hover:text-text-main transition-colors bg-surface-muted/50 border border-glass-border/20 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});
VariantSelector.displayName = 'VariantSelector';
