"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  Box, 
  Package
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { ProductDetailSheet } from '@/components/dashboard/ProductDetailSheet';

const InventoryItemRow = ({ product, onClick }) => {
  const stock = product.variants?.reduce((sum, v) => {
    if (v.stocks && v.stocks.length > 0) {
      const variantStock = v.stocks.reduce((acc, s) => acc + parseFloat(s.quantity || 0), 0);
      return sum + variantStock;
    }
    return sum + (parseFloat(v.stock_quantity) || 0);
  }, 0) || 0;
  const isLow = stock < 10;
  
  return (
    <div 
      onClick={() => { haptics.light(); onClick(product); }}
      className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 active:bg-brand/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0 text-text-secondary border border-glass-border/20">
          <Package size={18} />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">
            {product.name}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {product.main_category?.name || 'Catalog'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-glass-border/30" />
            <span className={`text-xs font-black ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
              {stock} in stock
            </span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-sm">
          {product.variants?.[0]?.price ? `LKR ${Math.round(product.variants[0].price).toLocaleString()}` : '---'}
        </p>
        <p className="text-[10px] font-black text-text-secondary opacity-30 mt-0.5 uppercase tracking-widest">
          {product.variants?.length || 0} Variants
        </p>
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const { openDrawer } = useUIStore();
  const { data: productsData, isLoading, error, mutate } = useFetch('/products/active/list');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const products = productsData?.data || productsData || [];

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const totalBackendCount = productsData?.meta?.total || productsData?.total || products.length;

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl pt-[calc(var(--sat)+1rem)] pb-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-main leading-none mb-1">Stock Hub</h1>
            <p className="text-[11px] font-semibold text-text-brand leading-none opacity-90">
              {isLoading ? 'Checking Stock...' : (searchTerm ? `${filteredProducts.length} / ${totalBackendCount} Items Found` : `${totalBackendCount} Items`)}
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
            onClick={() => { haptics.light(); mutate(); }}
            className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {isSearchVisible && (
        <section className="flex flex-col gap-3">
          <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
            <input
              type="text"
              autoFocus
              placeholder="Quick search SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
            />
          </div>
        </section>
      )}

      <section className="flex flex-col mt-2">
        {isLoading ? (
          <div className="flex flex-col">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 w-full border-b border-glass-border/5 animate-pulse bg-surface-muted/30" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="flex flex-col">
            {filteredProducts.map(product => (
              <InventoryItemRow key={product.id} product={product} onClick={(p) => { setSelectedProduct(p); setIsDetailOpen(true); }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-text-secondary">
            <Box size={40} strokeWidth={1} />
            <p className="text-[11px] font-black uppercase tracking-widest mt-4">No inventory matching</p>
          </div>
        )}
      </section>

      <ProductDetailSheet 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
