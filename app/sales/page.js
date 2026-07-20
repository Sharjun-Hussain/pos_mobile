"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
  Search,
  Menu,
  RefreshCcw,
  FileText,
  ShoppingBag,
  Filter,
  ArrowUpDown,
  Clock,
  ArrowUpAZ,
  ArrowDownAZ
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { SaleDetailsSheet } from '@/components/sales/SaleDetailsSheet';
import { ReturnSheet } from '@/components/sales/ReturnSheet';
import { useSearchParams } from 'next/navigation';

const SaleRow = React.memo(({ sale, onClick }) => {
  const date = new Date(sale.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-emerald-500 bg-emerald-500/10';
      case 'partially_paid': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-rose-500 bg-rose-500/10';
    }
  };

  return (
    <div
      onClick={() => { haptics.light(); onClick(sale.id); }}
      className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 active:bg-brand/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0 text-text-secondary border border-glass-border/20">
          <FileText size={18} />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-bold text-text-main text-sm truncate leading-tight">
              {sale.invoice_number}
            </h4>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${getStatusColor(sale.payment_status)}`}>
              {sale.payment_status}
            </span>
            {(sale.return_status === 'partial' || sale.return_status === 'full' || sale.returns?.length > 0) && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-orange-500/10 text-orange-600">
                Returned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {sale.customer?.name || 'Walk-in Guest'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-glass-border/30" />
            <span className="text-xs font-medium text-text-secondary opacity-40">
              {date}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-sm">LKR {Math.round(sale.payable_amount).toLocaleString()}</p>
        <p className="text-[10px] font-black text-text-secondary opacity-30 mt-0.5 uppercase tracking-tighter">
          {sale.payment_method || 'Cash'}
        </p>
      </div>
    </div>
  );
});

SaleRow.displayName = 'SaleRow';

function SalesHistoryPage() {
  const { data: salesData, isLoading: salesLoading, error: salesError, mutate: refetchSales } = useFetch('/sales?size=50');
  const { openDrawer } = useUIStore();

  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [activeSale, setActiveSale] = useState(null);
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [saleType, setSaleType] = useState('regular');
  const [sortBy, setSortBy] = useState('newest');
  const touchStartRef = React.useRef(null);
  const touchEndRef = React.useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = React.useCallback((e) => {
    touchEndRef.current = null;
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchMove = React.useCallback((e) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchEnd = React.useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > minSwipeDistance && saleType === 'regular') {
        haptics.light();
        setSaleType('hold');
      }
      if (distanceX < -minSwipeDistance && saleType === 'hold') {
        haptics.light();
        setSaleType('regular');
      }
    }
  }, [saleType]);

  const sales = salesData?.data || salesData || [];
  const loading = salesLoading;
  const error = salesError;

  const handleSaleClick = React.useCallback((saleId) => {
    setSelectedSaleId(saleId);
    setIsDetailsOpen(true);
  }, []);

  const handleReturnTrigger = (sale) => {
    setIsDetailsOpen(false);
    setActiveSale(sale);
    setIsReturnOpen(true);
  };

  const filteredSales = Array.isArray(sales) ? sales
    .filter(s => {
      const isHold = s.status === 'hold' || s.payment_status === 'hold';
      const matchesSaleType = saleType === 'hold' ? isHold : !isHold;

      const matchesSearch = (s.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'returned' && (s.return_status === 'partial' || s.return_status === 'full' || s.returns?.length > 0)) ||
        (filterStatus === 'paid' && s.payment_status === 'paid') ||
        (filterStatus === 'unpaid' && s.payment_status !== 'paid');

      return matchesSaleType && matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'amount_high') return parseFloat(b.payable_amount) - parseFloat(a.payable_amount);
      if (sortBy === 'amount_low') return parseFloat(a.payable_amount) - parseFloat(b.payable_amount);
      return 0;
    }) : [];

  return (
    <div 
      className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface overflow-x-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl pt-[calc(var(--sat)+1rem)] pb-3 -mx-4 px-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { haptics.light(); openDrawer(); }}
              className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-main leading-none mb-1">Recent Sales</h1>
              <p className="text-[11px] font-semibold text-text-brand leading-none opacity-90">
                {loading ? 'Consulting Records...' : `${filteredSales.length} Recent Invoices`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { 
                haptics.light(); 
                setIsSearchVisible(!isSearchVisible); 
                if (isSearchVisible) setSearchTerm(''); 
              }}
              className={`h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm ${isSearchVisible ? 'bg-brand/10 text-brand' : 'bg-surface-muted text-text-secondary hover:text-brand'}`}
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => { haptics.light(); refetchSales(); }}
              className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex w-full relative mt-2">
          <button
            onClick={() => { haptics.light(); setSaleType('regular'); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all ${saleType === 'regular' ? 'text-brand' : 'text-text-secondary hover:text-text-main'}`}
          >
            Regular Sales
          </button>
          <button
            onClick={() => { haptics.light(); setSaleType('hold'); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all ${saleType === 'hold' ? 'text-brand' : 'text-text-secondary hover:text-text-main'}`}
          >
            Hold Sales
          </button>
          
          {/* Track line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-glass-border/30" />
          
          {/* Animated slider */}
          <div 
            className="absolute bottom-0 w-1/2 h-[3px] bg-brand rounded-t-full transition-transform duration-300 ease-out z-10"
            style={{ transform: `translateX(${saleType === 'regular' ? '0%' : '100%'})` }}
          />
        </div>
      </header>

      {(isSearchVisible || saleType !== 'hold') && (
        <section className="flex flex-col gap-3">
          {isSearchVisible && (
            <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
              <input
                type="text"
                autoFocus
                placeholder="Search invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
              />
            </div>
          )}

          {/* Filters & Sorting */}
          {saleType !== 'hold' && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                {[
                  { id: 'all', label: 'All Sales' },
                  { id: 'paid', label: 'Paid' },
                  { id: 'unpaid', label: 'Unpaid' },
                  { id: 'returned', label: 'Refunded' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => { haptics.light(); setFilterStatus(chip.id); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${filterStatus === chip.id
                      ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105'
                      : 'bg-surface-muted text-text-secondary border-glass-border/40 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-6 bg-glass-border/20 flex-shrink-0" />

              <button
                onClick={() => {
                  haptics.medium();
                  const modes = ['newest', 'oldest', 'amount_high', 'amount_low'];
                  const next = modes[(modes.indexOf(sortBy) + 1) % modes.length];
                  setSortBy(next);
                }}
                className="flex items-center justify-center h-9 px-3 rounded-full bg-surface-muted border border-glass-border/40 text-[11px] font-bold text-text-main whitespace-nowrap active:scale-95 transition-transform hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
              >
                {sortBy === 'newest' && <Clock size={14} className="text-brand mr-1" />}
                {sortBy === 'oldest' && <Clock size={14} className="text-text-secondary rotate-180 mr-1" />}
                {sortBy === 'amount_high' && <ArrowUpAZ size={14} className="text-emerald-500 mr-1" />}
                {sortBy === 'amount_low' && <ArrowDownAZ size={14} className="text-rose-500 mr-1" />}
                Sort
              </button>
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col mt-2">
        {loading ? (
          <div className="flex flex-col">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 w-full border-b border-glass-border/5 animate-pulse bg-surface-muted/30" />
            ))}
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="flex flex-col">
            {filteredSales.map(sale => (
              <SaleRow key={sale.id} sale={sale} onClick={handleSaleClick} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-text-secondary">
            <ShoppingBag size={40} strokeWidth={1} />
            <p className="text-[11px] font-black uppercase tracking-widest mt-4">No recent sales found</p>
          </div>
        )}
      </section>

      <SaleDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        saleId={selectedSaleId}
        initialSaleData={filteredSales.find(s => s.id === selectedSaleId) || sales.find(s => s.id === selectedSaleId)}
        onReturnTrigger={handleReturnTrigger}
      />

      <ReturnSheet
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        sale={activeSale}
        onFinish={refetchSales}
      />
    </div>
  );
}

export default function SalesHistoryPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center">Loading...</div>}>
      <SalesHistoryPage />
    </Suspense>
  );
}
