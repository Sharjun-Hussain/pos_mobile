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
      <div className="relative w-full max-w-lg bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-glass-border animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center overflow-hidden border border-brand/20">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-brand" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-main leading-tight">{product.name}</h3>
              <p className="text-sm text-text-secondary font-medium mt-0.5">Select a variant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 glass-panel rounded-full flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
          <div className="grid gap-3">
            {product.variants?.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  haptics.medium();
                  onSelect(v);
                  onClose();
                }}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between text-left active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-text-main group-hover:text-brand transition-colors">
                    {v.variantName || 'Default'}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono mt-0.5 uppercase tracking-wider">
                    {v.barcode || 'NO BARCODE'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-black text-brand tracking-tight">
                      LKR {parseFloat(v.retailPrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg shadow-brand/10">
                    <Plus className="h-5 w-5 text-brand" strokeWidth={3} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border">
          <button 
            onClick={onClose}
            className="w-full h-14 glass-panel rounded-2xl text-sm font-bold text-text-secondary hover:text-text-main transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
