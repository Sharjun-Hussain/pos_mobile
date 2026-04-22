"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  Warehouse, 
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  TrendingDown,
  Activity
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const StockListItem = ({ stock, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isLow = stock.quantity < 5; // Simple threshold for visibility

  useEffect(() => {
    const imgField = stock.variant?.image || stock.product?.image;
    if (imgField) {
      getImageUrl(imgField).then(setImageUrl);
    }
  }, [stock, getImageUrl]);

  return (
    <div className="glass-panel p-4 rounded-[1.75rem] flex flex-col gap-3 group active:scale-[0.98] transition-all border-glass-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-surface-muted text-text-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Stock" className="w-full h-full object-cover" />
            ) : (
              <Warehouse size={20} strokeWidth={2.2} />
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-text-main text-[13px] truncate leading-tight">
              {stock.product?.name}
            </h4>
            <span className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-widest">
              {stock.variant?.name || 'Standard'}
            </span>
          </div>
        </div>
        <div className="h-8 w-8 glass-panel border-glass-border/20 rounded-lg flex items-center justify-center text-text-secondary/30">
          <ChevronRight size={14} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-glass-border/10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40">Branch</span>
          <span className="text-[11px] font-black text-text-main">{stock.branch?.name || 'Main Warehouse'}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40">Available</span>
          <div className="flex items-center justify-end gap-1.5">
            {isLow && <AlertTriangle size={12} className="text-rose-500 animate-pulse" strokeWidth={3} />}
            <span className={`text-[15px] font-black ${isLow ? 'text-rose-500' : 'text-brand'}`}>
              {parseFloat(stock.quantity).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StockRegistryPage() {
  const { openDrawer } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.stocks.getAll({ size: 100 });
      // Handle paginated structure: { data: { data: [], pagination: {} } }
      setStocks(res.data?.data || res.data || []);
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = Array.isArray(stocks) ? stocks.filter(s => 
    (s.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.variant?.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const lowStockCount = stocks.filter(s => s.quantity < 5).length;

  return (
    <div className="p-6 pb-24 flex flex-col gap-6 min-h-screen bg-surface">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Stock Control</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase leading-none">Global Stock Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => haptics.medium()}
            className="h-11 w-11 rounded-2xl glass-panel border-brand/20 bg-brand/5 text-brand flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <ArrowRightLeft size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Stock Summary Cards */}
      <section className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
        <div className="glass-panel p-4 rounded-[2rem] min-w-[200px] flex flex-col gap-3 border-emerald-500/10 bg-emerald-500/5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase leading-none mb-1.5">Healthy Stock</p>
            <h3 className="text-2xl font-black text-text-main leading-none">{(stocks.length - lowStockCount) || 0} <span className="text-[10px] font-bold text-text-secondary">SKUs</span></h3>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-[2rem] min-w-[200px] flex flex-col gap-3 border-rose-500/10 bg-rose-500/5">
          <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <TrendingDown size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase leading-none mb-1.5">Low Level Alerts</p>
            <h3 className="text-2xl font-black text-text-main leading-none">{lowStockCount || 0} <span className="text-[10px] font-bold text-text-secondary">SKUs</span></h3>
          </div>
        </div>
      </section>

      <section>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search stocks by product or branch..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/50"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1 px-1">
          <h2 className="text-[10px] font-black text-text-secondary uppercase opacity-60">
            {loading ? 'Consulting Ledger...' : 'Cross-Branch Inventory'}
          </h2>
          <button onClick={() => { haptics.light(); fetchStocks(); }} className="h-8 w-8 flex items-center justify-center text-brand">
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 w-full glass-panel rounded-[1.75rem] animate-pulse bg-surface-muted/50" />
          ))
        ) : filteredStocks.length > 0 ? (
          filteredStocks.map(stock => (
            <StockListItem 
              key={stock.id} 
              stock={stock} 
              getImageUrl={api.getImageUrl} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Warehouse size={48} strokeWidth={1} />
            <p className="text-xs font-bold mt-4">No stock records found</p>
          </div>
        )}
      </section>
    </div>
  );
}
