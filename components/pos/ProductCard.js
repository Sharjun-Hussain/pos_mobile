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
        className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 active:bg-brand/5 transition-colors cursor-pointer w-full text-left bg-transparent"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0 text-text-secondary border border-glass-border/20 group-hover:text-brand transition-colors">
            <Package size={18} />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">
              {product.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-secondary opacity-60">
                {product.category || 'General'}
              </span>
              {product.variants?.length > 1 && (
                <>
                  <div className="h-1 w-1 rounded-full bg-glass-border/30" />
                  <span className="text-[11px] font-black text-brand uppercase tracking-tighter">
                    {product.variants.length} Variants
                  </span>
                </>
              )}
            </div>
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
      className="bg-surface p-1.5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform border border-glass-border/30 group relative aspect-[4/5] overflow-hidden shadow-sm"
    >
      {product.variants?.length > 1 && (
        <div className="absolute top-1.5 right-1.5 p-1 bg-brand/10 text-brand rounded-lg shadow-sm z-10">
          <Maximize2 size={8} strokeWidth={4} />
        </div>
      )}
      <div className="w-full aspect-square rounded-xl bg-surface-muted overflow-hidden border border-glass-border/20 shadow-inner relative">
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
