"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  FileText,
  ShoppingBag
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { SaleDetailsSheet } from '@/components/sales/SaleDetailsSheet';
import { ReturnSheet } from '@/components/sales/ReturnSheet';

const SaleRow = ({ sale, onClick }) => {
  const date = new Date(sale.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'text-emerald-500 bg-emerald-500/10';
      case 'partially_paid': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-rose-500 bg-rose-500/10';
    }
  };

  return (
    <div 
      onClick={() => { haptics.light(); onClick(); }}
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
};

export default function SalesHistoryPage() {
  const { data: salesData, isLoading: salesLoading, error: salesError, mutate: refetchSales } = useFetch('/sales?size=50');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [activeSale, setActiveSale] = useState(null);

  const sales = salesData?.data || salesData || [];
  const loading = salesLoading;
  const error = salesError;

  const handleSaleClick = (saleId) => {
    setSelectedSaleId(saleId);
    setIsDetailsOpen(true);
  };

  const handleReturnTrigger = (sale) => {
    setIsDetailsOpen(false);
    setActiveSale(sale);
    setIsReturnOpen(true);
  };

  const filteredSales = Array.isArray(sales) ? sales.filter(s => 
    (s.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

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
            <h1 className="text-2xl font-black text-text-main leading-none mb-1">Recent Sales</h1>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-40">Transaction Ledger</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.light(); refetchSales(); }}
          className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input 
            type="text" 
            placeholder="Search invoice or customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/10 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30 uppercase tracking-widest">
            {loading ? 'Consulting Records...' : `${filteredSales.length} Recent Invoices`}
          </h2>
        </div>
        
        {loading ? (
          <div className="flex flex-col">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 w-full border-b border-glass-border/5 animate-pulse bg-surface-muted/30" />
            ))}
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="flex flex-col">
            {filteredSales.map(sale => (
              <SaleRow key={sale.id} sale={sale} onClick={() => handleSaleClick(sale.id)} />
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
