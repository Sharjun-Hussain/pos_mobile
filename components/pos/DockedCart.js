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
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-brand text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-brand/30">
            <ShoppingCart size={22} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold text-text-main">{cart.length} {t('pos.itemsSelected')}</p>
            <p className="text-[13px] font-semibold text-text-secondary mt-0.5">{formatCurrency(total)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <span className="text-[14px] font-bold text-brand">{t('pos.reviewCart')}</span>
          <ChevronRight size={18} className="text-brand opacity-60" />
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
