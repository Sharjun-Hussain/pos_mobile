"use client";

import React from 'react';
import { X, Plus, Package } from 'lucide-react';
import { haptics } from '@/services/haptics';

export const VariantSelector = ({ product, isOpen, onClose, onSelect }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 shadow-2xl border border-glass-border animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center overflow-hidden border border-brand/20">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-brand" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main leading-tight">{product.name}</h3>
              <p className="text-[10px] text-text-secondary font-bold opacity-60">Select a variation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 no-scrollbar flex-1 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {product.variants?.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  haptics.medium();
                  onSelect(v);
                  onClose();
                }}
                className="glass-panel p-3 rounded-2xl flex flex-col items-start gap-1 text-left active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border group relative"
              >
                <span className="font-bold text-text-main group-hover:text-brand transition-colors text-xs line-clamp-1">
                  {v.variantName || 'Default'}
                </span>
                <span className="text-[10px] font-black text-brand tracking-tighter">
                  LKR {parseFloat(v.retailPrice || 0).toLocaleString()}
                </span>
                <span className="text-[8px] text-text-secondary font-medium font-mono opacity-50">
                  {v.barcode || 'No SKU'}
                </span>
                
                <div className="absolute bottom-2 right-2 h-6 w-6 rounded-lg bg-brand/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <Plus className="h-3.5 w-3.5 text-brand" strokeWidth={3} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={onClose}
            className="w-full h-12 glass-panel rounded-xl text-xs font-bold text-text-secondary hover:text-text-main transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
