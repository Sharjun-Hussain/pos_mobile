"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  Box, 
  Menu, 
  RefreshCcw, 
  ChevronRight,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const ProductRow = ({ product, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    if (product.image) {
      getImageUrl(product.image).then(setImageUrl);
    }
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
          <h4 className="font-bold text-text-main text-[13px] truncate leading-tight mb-0.5">{product.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-secondary opacity-60">
              {product.main_category?.name || 'Uncategorized'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-brand uppercase">
              {product.variants?.length || 0} Variants
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300" />
    </div>
  );
};

export default function ProductsPage() {
  const { openDrawer } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        api.products.getAll({ size: 100 }),
        api.categories.getActiveList()
      ]);
      const productList = pRes.data?.data || pRes.data || [];
      setProducts(productList);
      setCategories(cRes.data || []);
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = Array.isArray(products) ? products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || String(p.main_category_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  }) : [];

  return (
    <div className="p-6 pb-24 flex flex-col gap-5 min-h-screen bg-white">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Products Hub</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase leading-none opacity-40">Catalog Management</p>
          </div>
        </div>
        <button 
          onClick={() => haptics.medium()}
          className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-transform"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Improved Light Mode Search Bar */}
      <section className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-text-main outline-none focus:border-brand/40 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          onClick={() => { haptics.light(); fetchData(); }}
          className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-transform hover:text-brand bg-white"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      {/* Simplified Category Filter */}
      <section className="overflow-x-auto no-scrollbar flex gap-1.5 -mx-6 px-6">
        <button
          onClick={() => { haptics.light(); setSelectedCategory(null); }}
          className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${
            !selectedCategory 
              ? 'bg-brand text-white' 
              : 'bg-slate-50 text-slate-500 border border-slate-100'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { haptics.light(); setSelectedCategory(cat.id); }}
            className={`px-4 h-8 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              String(selectedCategory) === String(cat.id)
                ? 'bg-brand text-white' 
                : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100 pb-2">
          <h2 className="text-[10px] font-black text-text-secondary uppercase opacity-30">
            {loading ? 'Refreshing Catalog...' : `${filteredProducts.length} Results`}
          </h2>
        </div>
        
        {loading ? (
          Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-14 w-full border-b border-slate-50 animate-pulse bg-slate-50/50" />
          ))
        ) : filteredProducts.length > 0 ? (
          <div className="flex flex-col">
            {filteredProducts.map(product => (
              <ProductRow key={product.id} product={product} getImageUrl={api.getImageUrl} />
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
