"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Package } from 'lucide-react';

export const LowStockCarousel = ({ items = [], isLoading, onRestock }) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="min-w-[200px] h-32 glass-panel rounded-[2rem] animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 snap-x snap-mandatory">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="min-w-[220px] glass-panel p-5 rounded-[2.5rem] bg-rose-500/5 snap-center border-rose-500/10 flex flex-col justify-between"
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
        </motion.div>
      ))}
    </div>
  );
};
