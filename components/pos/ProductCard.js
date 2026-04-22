"use client";

import React, { memo } from 'react';
import { Package, Maximize2 } from 'lucide-react';

const ProductCard = memo(({ product, onAdd, isWholesale }) => {
  const price = isWholesale ? product.variants[0]?.wholesalePrice : product.variants[0]?.retailPrice;
  
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
        <span className="text-[10px] font-bold text-brand tracking-tight">
          LKR {parseFloat(price || 0).toLocaleString()}
        </span>
      </div>
    </button>
  );
}, (prev, next) => {
  // Only re-render if essential props change
  return prev.product.id === next.product.id && 
         prev.isWholesale === next.isWholesale &&
         prev.product.variants[0]?.retailPrice === next.product.variants[0]?.retailPrice;
});

export default ProductCard;
