"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  Target,
  LayoutGrid,
  List,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const VariantRow = ({ variant, productName, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (variant.image) getImageUrl(variant.image).then(setImageUrl);
  }, [variant.image, getImageUrl]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 px-1 active:bg-brand/5 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={variant.name} className="w-full h-full object-cover" />
          ) : (
            <Target size={16} className="text-slate-400" />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-[13px] truncate leading-tight">
            {productName} <span className="font-medium text-slate-400">• {variant.name}</span>
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-text-secondary opacity-40">{variant.sku || 'No SKU'}</span>
            <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-brand">{variant.barcode || '---'}</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-[13px]">LKR {Math.round(variant.price).toLocaleString()}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
          {variant.stock_quantity || 0} in stock
        </p>
      </div>
    </div>
  );
};

const VariantGridItem = ({ variant, productName, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isLow = variant.stock_quantity < 5;
  useEffect(() => {
    if (variant.image) getImageUrl(variant.image).then(setImageUrl);
  }, [variant.image, getImageUrl]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-3 active:scale-[0.98] transition-all shadow-sm relative">
      {isLow && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
      <div className="aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-50">
        {imageUrl ? (
          <img src={imageUrl} alt={variant.name} className="w-full h-full object-cover" />
        ) : (
          <Target size={24} className="text-slate-200" />
        )}
      </div>
      <div className="overflow-hidden">
        <h4 className="font-bold text-text-main text-[11px] truncate leading-tight mb-1">{productName}</h4>
        <p className="text-[10px] text-slate-400 font-medium truncate mb-2">{variant.name}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[11px] font-black text-brand">LKR {Math.round(variant.price).toLocaleString()}</span>
          <span className={`text-[9px] font-black ${isLow ? 'text-rose-500' : 'text-slate-300'}`}>{variant.stock_quantity}q</span>
        </div>
      </div>
    </div>
  );
};

export default function VariantsPage() {
  const { openDrawer } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'price-desc', 'stock-low'
  const [error, setError] = useState(null);

  const fetchVariants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.products.getActiveList();
      const allVariants = [];
      const rawData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      rawData.forEach(product => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach(variant => {
            allVariants.push({
              ...variant,
              parentName: product.name
            });
          });
        }
      });
      
      setVariants(allVariants);
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const filteredAndSortedVariants = Array.isArray(variants) ? variants
    .filter(v => 
      (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.barcode || '').includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.parentName.localeCompare(b.parentName);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'stock-low') return (a.stock_quantity || 0) - (b.stock_quantity || 0);
      return 0;
    }) : [];

  return (
    <div className="p-6 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main leading-none mb-1">Variant Registry</h1>
            <p className="text-[10px] font-bold text-text-secondary leading-none opacity-40">SKU-Level Control</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.light(); fetchVariants(); }}
          className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-transform hover:text-brand bg-white"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search SKUs, names..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-text-main outline-none focus:border-brand/40 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* View & Sort Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => { haptics.light(); setSortBy(e.target.value); }}
              className="h-8 bg-slate-50 border border-slate-100 rounded-lg px-2 text-[10px] font-bold text-text-secondary outline-none appearance-none pr-6 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              <option value="name-asc">Name: A-Z</option>
              <option value="price-desc">Highest Price</option>
              <option value="price-asc">Lowest Price</option>
              <option value="stock-low">Low Stock First</option>
            </select>
          </div>
          
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button 
              onClick={() => { haptics.light(); setViewMode('list'); }}
              className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand' : 'text-slate-400'}`}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => { haptics.light(); setViewMode('grid'); }}
              className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand' : 'text-slate-400'}`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100 pb-2">
          <h2 className="text-[10px] font-black text-text-secondary opacity-30">
            {loading ? 'Refreshing Registry...' : `${filteredAndSortedVariants.length} active SKUs`}
          </h2>
        </div>
        
        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? "aspect-square w-full rounded-2xl animate-pulse bg-slate-50/50" : "h-12 w-full border-b border-slate-50 animate-pulse bg-slate-50/50"} />
            ))}
          </div>
        ) : filteredAndSortedVariants.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {filteredAndSortedVariants.map(variant => (
              viewMode === 'list' 
                ? <VariantRow key={variant.id} variant={variant} productName={variant.parentName} getImageUrl={api.getImageUrl} />
                : <VariantGridItem key={variant.id} variant={variant} productName={variant.parentName} getImageUrl={api.getImageUrl} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Target size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No variants registered</p>
          </div>
        )}
      </section>
    </div>
  );
}
