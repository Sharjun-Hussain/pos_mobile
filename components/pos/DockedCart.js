"use client";

import React, { memo } from 'react';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';

const DockedCart = memo(({ cart, total, onClick, isVisible }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 px-4 z-[90]">
      <button 
        onClick={onClick}
        className="w-full glass-panel rounded-[2rem] p-5 flex items-center justify-between shadow-2xl transition-all active:scale-95 border-brand/30 shadow-brand/10 animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative h-12 w-12 bg-brand text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-brand/30 flex-shrink-0">
            <ShoppingCart size={22} strokeWidth={2.5} />
            <div className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-surface">
              {cart.length}
            </div>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[15px] font-bold text-text-main truncate whitespace-nowrap">{formatCurrency(total)}</p>
            <p className="text-[11px] font-semibold text-text-secondary mt-0.5 truncate whitespace-nowrap uppercase tracking-wider">{t('pos.itemsSelected')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-2 flex-shrink-0">
          <span className="text-[14px] font-bold text-brand whitespace-nowrap">{t('pos.reviewCart')}</span>
          <ChevronRight size={18} className="text-brand opacity-60 flex-shrink-0" />
        </div>
      </button>
    </div>
  );
}, (prev, next) => {
  return prev.cart.length === next.cart.length && 
         prev.total === next.total && 
         prev.isVisible === next.isVisible;
});

export default DockedCart;
