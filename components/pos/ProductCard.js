"use client";

import React, { memo } from 'react';
import { Package, Maximize2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

const ProductCard = memo(({ product, onAdd, viewMode }) => {
  const isWholesale = useSettingsStore((state) => state.isWholesale);
  const firstVariant = product.variants[0];
  const price = isWholesale ? firstVariant?.wholesalePrice : firstVariant?.retailPrice;
  const isGrid = viewMode === 'grid';

  if (!isGrid) {
    return (
      <button
        onClick={() => onAdd(product)}
        className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 active:bg-brand/5 transition-colors cursor-pointer w-full text-left bg-transparent"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0 text-text-secondary border border-glass-border/20">
            <Package size={18} />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-text-secondary opacity-60">
                {product.category || 'General'}
              </span>
              <div className="h-1 w-1 rounded-full bg-glass-border/30" />
              <span className={`text-[11px] font-bold ${product.stock <= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                Stock: {Number(product.stock)}
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

        <div className="text-right flex flex-col items-end shrink-0 ml-2">
          <span className="text-sm font-black text-brand">
            LKR {parseFloat(price || 0).toLocaleString()}
          </span>
          {product.variants?.length === 1 && firstVariant?.sku && (
            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">
              {firstVariant.sku}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onAdd(product)}
      className="bg-surface p-1.5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform border border-glass-border/30 group relative aspect-[4/5] overflow-hidden shadow-sm"
    >
      {/* Stock Badge */}
      <div className={`absolute top-0 left-0 z-10 px-2 py-1 rounded-br-xl text-[9px] font-black
        ${product.stock <= 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
        {Number(product.stock)}
      </div>

      {/* Variant Badge */}
      {product.variants?.length > 1 && (
        <div className="absolute top-0 right-0 z-10 p-1.5 bg-brand text-white rounded-bl-xl">
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
        <span className="font-bold text-text-main text-[9px] leading-tight mb-0.5 line-clamp-1">
          {product.name}
        </span>
        {product.variants?.length === 1 && firstVariant?.sku && (
          <span className="text-[7px] font-bold opacity-30 uppercase tracking-tighter mb-0.5">
            {firstVariant.sku}
          </span>
        )}
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
