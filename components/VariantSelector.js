"use client";

import React from 'react';
import { X, Plus, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/services/haptics';

export const VariantSelector = ({ product, isOpen, onClose, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, info) => {
              // Close if dragged down more than 100px or fast swipe
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="relative w-full max-w-lg bg-surface rounded-t-[2.5rem] p-5 shadow-2xl border border-glass-border pointer-events-auto flex flex-col max-h-[85vh] touch-none"
          >
            {/* Native Drag Handle */}
            <div className="flex justify-center pb-4 -mt-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
