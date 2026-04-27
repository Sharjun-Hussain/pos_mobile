"use client";

import React, { useState } from 'react';
import {
  Search,
  Menu,
  RefreshCcw,
  RotateCcw,
  FileText,
  TrendingDown,
  Clock,
  ArrowUpAZ,
  ArrowDownAZ
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';

const ReturnRow = ({ returnRecord }) => {
  const { formatCurrency } = useCurrency();
  const date = new Date(returnRecord.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      onClick={() => haptics.light()}
      className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 active:bg-rose-500/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-xl bg-rose-500/5 flex items-center justify-center flex-shrink-0 text-rose-500 border border-rose-500/10">
          <RotateCcw size={18} />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-bold text-text-main text-sm truncate leading-tight">
              {returnRecord.invoice_number || 'Return Record'}
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase bg-rose-500 text-white">
              REFUND
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              Ref: {returnRecord.return_number || returnRecord.id.slice(0, 8)}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-glass-border/30" />
            <span className="text-xs font-medium text-text-secondary opacity-40">
              {date}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-rose-500 text-sm">{formatCurrency(returnRecord.refund_amount || 0)}</p>
        <p className="text-[10px] font-black text-text-secondary opacity-30 mt-0.5 uppercase tracking-tighter">
          {returnRecord.refund_method || 'Cash'}
        </p>
      </div>
    </div>
  );
};

export default function ReturnsHistoryPage() {
  const { t } = useTranslation();
  const { data: returnsData, isLoading: loading, mutate: refetch } = useFetch('/sales/returns/list?size=50');
  const { openDrawer } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const returns = returnsData?.data || returnsData || [];

  const filteredReturns = Array.isArray(returns) ? returns
    .filter(r =>
      (r.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.return_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'amount_high') return parseFloat(b.refund_amount || 0) - parseFloat(a.refund_amount || 0);
      if (sortBy === 'amount_low') return parseFloat(a.refund_amount || 0) - parseFloat(b.refund_amount || 0);
      return 0;
    }) : [];

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main leading-none mb-1">Sales Returns</h1>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-70">Refund Manifest</p>
          </div>
        </div>
        <button
          onClick={() => { haptics.light(); refetch(); }}
          className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-rose-500 bg-surface-muted shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search return ref or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-rose-500/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>

        <div className="flex justify-end px-1">
          <button
            onClick={() => {
              haptics.medium();
              const modes = ['newest', 'oldest', 'amount_high', 'amount_low'];
              const next = modes[(modes.indexOf(sortBy) + 1) % modes.length];
              setSortBy(next);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-muted border border-glass-border/20 text-[11px] font-black uppercase tracking-wider text-text-main active:scale-95 transition-transform"
          >
            {sortBy === 'newest' && <Clock size={12} className="text-rose-500" />}
            {sortBy === 'oldest' && <Clock size={12} className="opacity-30 rotate-180" />}
            {sortBy === 'amount_high' && <ArrowUpAZ size={12} className="text-emerald-500" />}
            {sortBy === 'amount_low' && <ArrowDownAZ size={12} className="text-rose-500" />}
            {sortBy.replace('_', ' ')}
          </button>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/10 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30 uppercase tracking-widest">
            {loading ? 'Fetching Returns...' : `${filteredReturns.length} Recent Returns`}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 w-full border-b border-glass-border/5 animate-pulse bg-surface-muted/30" />
            ))}
          </div>
        ) : filteredReturns.length > 0 ? (
          <div className="flex flex-col">
            {filteredReturns.map(ret => (
              <ReturnRow key={ret.id} returnRecord={ret} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-text-secondary">
            <TrendingDown size={40} strokeWidth={1} />
            <p className="text-[11px] font-black uppercase tracking-widest mt-4">No returns recorded</p>
          </div>
        )}
      </section>
    </div>
  );
}
