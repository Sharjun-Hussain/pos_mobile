"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  Box, 
  Menu, 
  RefreshCcw, 
  Filter,
  ChevronRight,
  Layer
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const ProductCard = ({ product, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    if (product.image) {
      getImageUrl(product.image).then(setImageUrl);
    }
  }, [product.image, getImageUrl]);

  return (
    <div className="glass-panel p-4 rounded-[2rem] flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={24} strokeWidth={2.5} />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-black text-text-main text-sm truncate leading-tight">{product.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded-md">
              {product.main_category?.name || 'Uncategorized'}
            </span>
            <div className="h-1 w-1 rounded-full bg-text-secondary/20" />
            <span className="text-[10px] font-bold text-text-secondary opacity-60">
              {product.variants?.length || 0} Variants
            </span>
          </div>
        </div>
      </div>
      <div className="h-10 w-10 glass-panel border-glass-border/20 rounded-xl flex items-center justify-center text-text-secondary/40">
        <ChevronRight size={18} />
      </div>
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
        api.products.getAll({ size: 100 }), // Paginated fetch
        api.categories.getActiveList()
      ]);
      setProducts(pRes.data || []);
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || p.main_category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Products Hub</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">Catalog Management</p>
          </div>
        </div>
        <button 
          onClick={() => haptics.medium()}
          className="h-12 w-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      <section className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/50"
          />
        </div>
        <button 
          onClick={() => { haptics.light(); fetchData(); }}
          className="h-14 w-14 glass-panel border-glass-border/30 rounded-2xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      {/* Category Filter */}
      <section className="overflow-x-auto no-scrollbar flex gap-2 -mx-6 px-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            !selectedCategory 
              ? 'bg-brand text-white shadow-lg shadow-brand/20' 
              : 'glass-panel text-text-secondary border-glass-border/40'
          }`}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 h-9 rounded-full text-[10px] font-black uppercase whitespace-nowrap tracking-widest transition-all ${
              selectedCategory === cat.id
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'glass-panel text-text-secondary border-glass-border/40'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1 px-1">
          <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">
            {loading ? 'Refreshing Catalog...' : `${filteredProducts.length} Products Found`}
          </h2>
        </div>
        
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 w-full glass-panel rounded-[2rem] animate-pulse bg-surface-muted/50" />
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} getImageUrl={api.getImageUrl} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Package size={48} strokeWidth={1} />
            <p className="text-xs font-bold mt-4">No products in this catalog</p>
          </div>
        )}
      </section>
    </div>
  );
}
