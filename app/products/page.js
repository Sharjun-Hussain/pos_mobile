"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Menu, 
  RefreshCcw, 
  ChevronRight,
  LayoutGrid,
  List,
  SortAsc
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';

const ProductRow = ({ product, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (product.image) getImageUrl(product.image).then(setImageUrl);
  }, [product.image, getImageUrl]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 px-1 active:bg-brand/5 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={18} className="text-slate-400" />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">{product.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {product.main_category?.name || 'Uncategorized'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="text-xs font-bold text-brand">
              {product.variants?.length || 0} Variants
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  );
};

const ProductGridItem = ({ product, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (product.image) getImageUrl(product.image).then(setImageUrl);
  }, [product.image, getImageUrl]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-3 active:scale-[0.98] transition-all shadow-sm">
      <div className="aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-50">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={32} className="text-slate-200" />
        )}
      </div>
      <div className="overflow-hidden">
        <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-1">{product.name}</h4>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary opacity-50">{product.main_category?.name || '---'}</span>
          <span className="text-xs font-black text-brand bg-brand/5 px-1.5 py-0.5 rounded-md">
            {product.variants?.length || 0}v
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const { openDrawer } = useUIStore();
  const { data: productsData, isLoading: productsLoading, error: productsError, mutate: mutateProducts } = useFetch('/products?size=100');
  const { data: categoriesData, isLoading: categoriesLoading } = useFetch('/main-categories/active/list');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'variants-desc'

  const products = productsData?.data || productsData || [];
  const categories = categoriesData || [];
  const loading = productsLoading || categoriesLoading;
  const error = productsError;

  const filteredAndSortedProducts = Array.isArray(products) ? products
    .filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || String(p.main_category_id) === String(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'variants-desc') return (b.variants?.length || 0) - (a.variants?.length || 0);
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
            <h1 className="text-2xl font-black text-text-main leading-none mb-1">Products Hub</h1>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-40">Catalog Management</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.light(); mutateProducts(); }}
          className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-transform hover:text-brand bg-white"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        {/* Search Bar Row */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* View & Sort Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => { haptics.light(); setSortBy(e.target.value); }}
              className="h-9 bg-slate-50 border border-slate-100 rounded-lg px-2 text-xs font-bold text-text-secondary outline-none appearance-none pr-6 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="variants-desc">Major Variants</option>
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

      {/* Simplified Category Filter */}
      <section className="overflow-x-auto no-scrollbar flex gap-1.5 -mx-6 px-6">
        <button
          onClick={() => { haptics.light(); setSelectedCategory(null); }}
          className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${!selectedCategory ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { haptics.light(); setSelectedCategory(cat.id); }}
            className={`px-4 h-8 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${String(selectedCategory) === String(cat.id) ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
          >
            {cat.name}
          </button>
        ))}
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {loading ? 'Refreshing Catalog...' : `${filteredAndSortedProducts.length} results`}
          </h2>
        </div>
        
        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? "aspect-square w-full rounded-2xl animate-pulse bg-slate-50/50" : "h-14 w-full border-b border-slate-50 animate-pulse bg-slate-50/50"} />
            ))}
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col"}>
            {filteredAndSortedProducts.map(product => (
              viewMode === 'list' 
                ? <ProductRow key={product.id} product={product} getImageUrl={api.getImageUrl} />
                : <ProductGridItem key={product.id} product={product} getImageUrl={api.getImageUrl} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Package size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
}
