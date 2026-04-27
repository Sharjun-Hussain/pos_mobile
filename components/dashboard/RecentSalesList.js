"use client";

import React, { memo } from 'react';
import { Clock, ChevronRight, User, RotateCcw } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export const RecentSalesList = memo(({ sales = [], isLoading, onSaleClick }) => {
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 glass-panel p-4 rounded-[2rem] flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-surface-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-surface-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-surface-muted rounded animate-pulse" />
              <div className="h-2 w-12 bg-surface-muted rounded animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center gap-3 opacity-30 italic">
        <p className="text-xs font-bold">No recent activity</p>
      </div>
    );
  }

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMins = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {sales.map((item) => {
        const isReturn = item.txType === 'return';
        const amount = isReturn ? parseFloat(item.refund_amount || 0) : parseFloat(item.payable_amount || 0);
        
        return (
          <button
            key={item.id}
            onClick={() => onSaleClick?.(item)}
            className="glass-panel p-4 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all hover:bg-surface-muted/30"
          >
            <div className="flex items-center gap-4 text-left">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                isReturn ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'
              }`}>
                {isReturn ? <RotateCcw size={20} /> : <User size={20} />}
              </div>
              <div>
                <h5 className="text-sm font-bold text-text-main line-clamp-1">
                  {isReturn ? (item.invoice_number || 'Sale Return') : (item.customer?.name || "Walk-in Guest")}
                </h5>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-bold text-text-secondary opacity-60 flex items-center gap-1 uppercase tracking-wider">
                    <Clock size={10} /> {getTimeAgo(item.created_at)}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-text-secondary/20" />
                  <p className={`text-xs font-bold uppercase ${isReturn ? 'text-rose-500' : 'text-brand'}`}>
                    {isReturn ? 'REFUND' : (item.payment_method || 'CASH')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-black leading-none ${isReturn ? 'text-rose-500' : 'text-text-main'}`}>
                  {isReturn && '-'} {formatCurrency(amount)}
                </p>
                <p className="text-[10px] font-bold text-text-secondary mt-1 tracking-tight">
                  {isReturn ? (item.return_number || item.id.slice(0,8)) : item.invoice_number}
                </p>
              </div>
              <ChevronRight size={16} className="text-text-secondary opacity-30" />
            </div>
          </button>
        );
      })}
    </div>
  );
});

RecentSalesList.displayName = 'RecentSalesList';
