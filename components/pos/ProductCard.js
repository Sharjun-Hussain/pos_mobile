"use client";

import React, { memo } from 'react';
import { Package, Maximize2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

const ProductCard = memo(({ product, onAdd, viewMode }) => {
  const isWholesale = useSettingsStore((state) => state.isWholesale);
  const price = isWholesale ? product.variants[0]?.wholesalePrice : product.variants[0]?.retailPrice;
  const isGrid = viewMode === 'grid';
  
  if (!isGrid) {
    return (
      <button 
        onClick={() => onAdd(product)}
        className="glass-panel p-3 px-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all border-glass-border group relative overflow-hidden"
      >
        <div className="flex-1 text-left flex flex-col justify-center min-w-0 pr-4">
          <span className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">
            {product.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-text-secondary opacity-60">
              {product.category || 'General'}
            </span>
            {product.variants?.length > 1 && (
              <>
                <div className="h-1 w-1 rounded-full bg-glass-border" />
                <span className="text-[10px] font-bold text-brand uppercase tracking-tighter">
                  {product.variants.length} Variants
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-sm font-black text-brand">
            LKR {parseFloat(price || 0).toLocaleString()}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={() => onAdd(product)}
      className="glass-panel p-1.5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all border-glass-border group relative aspect-[4/5] overflow-hidden"
    >
      {product.variants?.length > 1 && (
        <div className="absolute top-1.5 right-1.5 p-1 bg-brand/10 text-brand rounded-lg shadow-sm z-10">
          <Maximize2 size={8} strokeWidth={4} />
        </div>
      )}
      <div className="w-full aspect-square rounded-xl bg-surface-muted overflow-hidden border border-glass-border shadow-inner group-hover:scale-105 transition-transform duration-500 relative">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            className="h-full w-full object-cover" 
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-text-secondary/10">
            <Package size={20} />
          </div>
        )}
      </div>
      <div className="text-center w-full px-0.5 flex flex-col">
        <span className="font-bold text-text-main text-[9px] leading-tight mb-0.5 line-clamp-2 h-[1rem]">
          {product.name}
        </span>
        <span className="text-[10px] font-bold text-brand">
          LKR {parseFloat(price || 0).toLocaleString()}
        </span>
      </div>
    </button>
  );
}, (prev, next) => {
  return prev.product.id === next.product.id && 
         prev.viewMode === next.viewMode &&
         prev.product.variants[0]?.retailPrice === next.product.variants[0]?.retailPrice;
});

export default ProductCard;
