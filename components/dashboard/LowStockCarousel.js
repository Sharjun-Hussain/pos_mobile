"use client";

import React, { memo } from 'react';
import { AlertTriangle, Plus, Package } from 'lucide-react';

export const LowStockCarousel = memo(({ items = [], isLoading, onRestock }) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden -mx-4 px-4 no-scrollbar">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="min-w-[220px] h-40 glass-panel p-5 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-2xl bg-surface-muted animate-pulse" />
              <div className="h-4 w-12 rounded-full bg-surface-muted animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-3/4 bg-surface-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-surface-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 snap-x snap-mandatory animate-in fade-in slide-in-from-right-4 duration-700">
      {items.map((item) => (
        <div
          key={item.id}
          className="min-w-[220px] glass-panel p-5 rounded-[2.5rem] bg-rose-500/5 snap-center border-rose-500/10 flex flex-col justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.stock} left</span>
            </div>
          </div>
          
          <div className="mt-4">
            <h5 className="text-sm font-black text-text-main leading-tight line-clamp-1">{item.name}</h5>
            <p className="text-[10px] font-bold text-text-secondary opacity-60 mt-1 uppercase">Reorder Level: {item.reorder_level || 5}</p>
          </div>

          <button 
            onClick={() => onRestock?.(item)}
            className="w-full h-10 mt-4 bg-white text-rose-500 border border-rose-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={14} strokeWidth={3} /> Restock Now
          </button>
        </div>
      ))}
    </div>
  );
});

LowStockCarousel.displayName = 'LowStockCarousel';
