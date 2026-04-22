"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  Warehouse, 
  AlertTriangle,
  ArrowRightLeft,
  LayoutGrid,
  List,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';

const StockRow = ({ stock, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isLow = stock.quantity < 5;
  useEffect(() => {
    const imgField = stock.variant?.image || stock.product?.image;
    if (imgField) getImageUrl(imgField).then(setImageUrl);
  }, [stock, getImageUrl]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-glass-border/30 px-1 active:bg-brand/5 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-9 w-9 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-glass-border/20">
          {imageUrl ? (
            <img src={imageUrl} alt="Stock" className="w-full h-full object-cover" />
          ) : (
            <Warehouse size={16} className="text-text-secondary opacity-50" />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight">
            {stock.product?.name} <span className="font-medium text-text-secondary opacity-60">• {stock.variant?.name || 'Standard'}</span>
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-text-secondary opacity-60">{stock.branch?.name || 'Main Warehouse'}</span>
            {isLow && (
              <div className="flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                <AlertTriangle size={8} className="text-rose-500" strokeWidth={3} />
                <span className="text-xs font-black text-rose-500">low</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <span className={`text-[15px] font-black ${isLow ? 'text-rose-500' : 'text-brand'}`}>
          {parseFloat(stock.quantity).toLocaleString()}
        </span>
        <p className="text-xs font-bold text-text-secondary opacity-40 mt-0.5">qty</p>
      </div>
    </div>
  );
};

const StockGridItem = ({ stock, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isLow = stock.quantity < 5;
  useEffect(() => {
    const imgField = stock.variant?.image || stock.product?.image;
    if (imgField) getImageUrl(imgField).then(setImageUrl);
  }, [stock, getImageUrl]);

  return (
    <div className="bg-surface border border-glass-border/30 rounded-2xl p-3 flex flex-col gap-3 active:scale-[0.98] transition-all shadow-sm relative text-center">
      <div className="aspect-square w-full rounded-xl bg-surface-muted flex items-center justify-center overflow-hidden border border-glass-border/20">
        {imageUrl ? (
          <img src={imageUrl} alt="Stock" className="w-full h-full object-cover" />
        ) : (
          <Warehouse size={24} className="text-text-secondary opacity-30" />
        )}
      </div>
      <div>
        <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-1">{stock.product?.name}</h4>
        <p className="text-xs text-text-secondary opacity-60 font-bold truncate mb-3">{stock.branch?.name || 'Main'}</p>
        <div className={`h-8 rounded-xl flex items-center justify-center ${isLow ? 'bg-rose-500 text-white' : 'bg-brand/10 text-brand'} transition-colors`}>
          <span className="text-sm font-black">{parseFloat(stock.quantity).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default function StockRegistryPage() {
  const { data: stocksData, isLoading: stocksLoading, error: stocksError, mutate: refetchStocks } = useFetch('/stocks?size=100');

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'qty-desc', 'qty-low'

  const stocks = stocksData?.data || stocksData || [];
  const loading = stocksLoading;
  const error = stocksError;

  const filteredAndSortedStocks = Array.isArray(stocks) ? stocks
    .filter(s => 
      (s.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.variant?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.product?.name || '').localeCompare(b.product?.name || '');
      if (sortBy === 'qty-desc') return (parseFloat(b.quantity) || 0) - (parseFloat(a.quantity) || 0);
      if (sortBy === 'qty-low') return (parseFloat(a.quantity) || 0) - (parseFloat(b.quantity) || 0);
      return 0;
    }) : [];

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-[42px] w-[42px] flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-10px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main leading-none mb-1">Stock Control</h1>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-70">Global Stock Ledger</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.light(); refetchStocks(); }}
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
            placeholder="Search SKUs, names..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>

        {/* View & Sort Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => { haptics.light(); setSortBy(e.target.value); }}
              className="h-9 bg-surface-muted border border-glass-border/30 rounded-lg px-2 text-xs font-bold text-text-secondary outline-none appearance-none pr-6 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              <option value="name-asc">Name: A-Z</option>
              <option value="qty-desc">Highest Quantity</option>
              <option value="qty-low">Low Stock Alerts</option>
            </select>
          </div>
          
          <div className="flex bg-surface-muted p-1 rounded-lg border border-glass-border/20">
            <button 
              onClick={() => { haptics.light(); setViewMode('list'); }}
              className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-surface shadow-sm text-brand border border-glass-border/20' : 'text-text-secondary opacity-50'}`}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => { haptics.light(); setViewMode('grid'); }}
              className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-surface shadow-sm text-brand border border-glass-border/20' : 'text-text-secondary opacity-50'}`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/30 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {loading ? 'Consulting Ledger...' : `${filteredAndSortedStocks.length} records`}
          </h2>
        </div>
        
        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? "aspect-square w-full rounded-2xl animate-pulse bg-surface-muted" : "h-14 w-full border-b border-glass-border/10 animate-pulse bg-surface-muted"} />
            ))}
          </div>
        ) : filteredAndSortedStocks.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {filteredAndSortedStocks.map(stock => (
              viewMode === 'list' 
                ? <StockRow key={stock.id} stock={stock} getImageUrl={api.getImageUrl} />
                : <StockGridItem key={stock.id} stock={stock} getImageUrl={api.getImageUrl} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Warehouse size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No stock found</p>
          </div>
        )}
      </section>
    </div>
  );
}
