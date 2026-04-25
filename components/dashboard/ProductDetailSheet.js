"use client";

import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { 
  X, 
  Package, 
  Tag, 
  Layers, 
  MapPin, 
  BarChart3, 
  ChevronRight,
  Info,
  Archive
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export const ProductDetailSheet = ({ isOpen, onClose, product }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useHardwareBack(isOpen, onClose);

  useEffect(() => {
    if (product?.image) {
      api.getImageUrl(product.image).then(setImageUrl);
    } else {
      setImageUrl(null);
    }
  }, [product]);

  if (!product) return null;

  return (
    <Drawer.Root open={isOpen} onClose={onClose} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[111] outline-none shadow-2xl h-[95dvh] pb-[calc(var(--sab)+1rem)]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-10">
            {/* Header section */}
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="h-32 w-32 rounded-3xl bg-surface-muted overflow-hidden border border-glass-border shadow-inner relative group">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary opacity-20">
                    <Package size={48} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-text-main leading-tight mb-2">{product.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-wider border border-brand/20">
                    {product.main_category?.name || 'General Catalog'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="glass-panel p-4 rounded-2xl border-glass-border/30 flex flex-col gap-1">
                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Total Variants</span>
                <span className="text-xl font-black text-text-main">{product.variants?.length || 0}</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-glass-border/30 flex flex-col gap-1">
                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Total Stock</span>
                <span className="text-xl font-black text-brand">
                  {product.variants?.reduce((sum, v) => sum + (parseFloat(v.stock_quantity) || 0), 0) || 0}
                </span>
              </div>
            </div>

            {/* Variant List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-text-secondary opacity-50 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} /> Variant Registry
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {product.variants?.map((v, idx) => (
                  <div 
                    key={v.id || idx}
                    className="glass-panel p-4 rounded-[1.5rem] border-glass-border/30 flex items-center justify-between active:bg-brand/5 transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="font-bold text-text-main text-sm truncate">{v.name || 'Standard Variant'}</h4>
                      <p className="text-[10px] font-bold text-text-secondary opacity-50 truncate mt-0.5">
                        SKU: {v.sku || 'No SKU'} • Barcode: {v.barcode || '---'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand">LKR {parseFloat(v.price || 0).toLocaleString()}</p>
                      <p className="text-[10px] font-extrabold text-text-secondary opacity-40 mt-1">
                        {v.stock_quantity || 0} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info / Description */}
            {product.description && (
              <div className="mt-8 flex flex-col gap-3">
                <h3 className="text-xs font-black text-text-secondary opacity-50 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Info size={14} /> Product Profile
                </h3>
                <div className="glass-panel p-4 rounded-[1.5rem] border-glass-border/30 text-xs font-medium text-text-secondary leading-relaxed italic">
                  {product.description}
                </div>
              </div>
            )}

            {/* Danger Zone (Optional - for future) */}
            <div className="mt-10 opacity-10 grayscale">
               <div className="h-[1px] w-full bg-glass-border/30 mb-8" />
               <div className="flex justify-center">
                  <button className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
                    <Archive size={14} /> Archive Product
                  </button>
               </div>
            </div>
          </div>

          <div className="p-5 border-t border-glass-border bg-surface pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button 
              onClick={() => { haptics.medium(); onClose(); }}
              className="w-full h-14 bg-surface-muted border border-glass-border text-text-main font-black rounded-2xl active:scale-[0.98] transition-all shadow-sm"
            >
              Close Details
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
