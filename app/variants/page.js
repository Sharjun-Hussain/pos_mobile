"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  RefreshCcw, 
  ChevronRight,
  Target,
  Hash,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const VariantRow = ({ variant, productName, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    if (variant.image) {
      getImageUrl(variant.image).then(setImageUrl);
    }
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
            <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-tight">{variant.sku || 'No SKU'}</span>
            <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-brand uppercase">{variant.barcode || '---'}</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-[13px]">LKR {Math.round(variant.price).toLocaleString()}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
          {variant.stock_quantity || 0} In Stock
        </p>
      </div>
    </div>
  );
};

export default function VariantsPage() {
  const { openDrawer } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredVariants = Array.isArray(variants) ? variants.filter(v => 
    (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.barcode || '').includes(searchTerm)
  ) : [];

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
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Variant Registry</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase leading-none opacity-40">SKU-Level Control</p>
          </div>
        </div>
      </header>

      {/* Improved Light Mode Search Bar */}
      <section className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search SKUs, names..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-text-main outline-none focus:border-brand/40 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          onClick={() => { haptics.light(); fetchVariants(); }}
          className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-transform hover:text-brand bg-white"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100 pb-2">
          <h2 className="text-[10px] font-black text-text-secondary uppercase opacity-30">
            {loading ? 'Refreshing Registry...' : `${filteredVariants.length} Variants`}
          </h2>
        </div>
        
        {loading ? (
          Array(12).fill(0).map((_, i) => (
            <div key={i} className="h-12 w-full border-b border-slate-50 animate-pulse bg-slate-50/50" />
          ))
        ) : filteredVariants.length > 0 ? (
          <div className="flex flex-col">
            {filteredVariants.map(variant => (
              <VariantRow 
                key={variant.id} 
                variant={variant} 
                productName={variant.parentName} 
                getImageUrl={api.getImageUrl} 
              />
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
