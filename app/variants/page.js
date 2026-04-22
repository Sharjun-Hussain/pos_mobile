"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Box, 
  Menu, 
  RefreshCcw, 
  ChevronRight,
  Target,
  Hash,
  DollarSign
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

const VariantListItem = ({ variant, productName, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    if (variant.image) {
      getImageUrl(variant.image).then(setImageUrl);
    }
  }, [variant.image, getImageUrl]);

  return (
    <div className="glass-panel p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-11 w-11 rounded-xl bg-surface-muted text-text-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={variant.name} className="w-full h-full object-cover" />
          ) : (
            <Target size={18} strokeWidth={2.5} />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-[13px] truncate leading-tight">
            {productName}
            <span className="text-text-secondary font-medium ml-1.5 opacity-60">• {variant.name}</span>
          </h4>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1">
              <Hash size={10} className="text-brand opacity-60" />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{variant.sku || 'No SKU'}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-text-secondary/20" />
            <span className="text-[10px] font-bold text-brand uppercase">{variant.barcode || 'No Barcode'}</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-xs">LKR {(parseFloat(variant.price) || 0).toLocaleString()}</p>
        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-0.5 opacity-60">
          {variant.stock_quantity || 0} in stock
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
      
      // Use helper to handle both paginated and flat lists
      const rawData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      // Flatten products to a list of variants
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

  const filteredVariants = variants.filter(v => 
    (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.barcode || '').includes(searchTerm)
  );

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
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Variant Registry</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase leading-none">SKU-Level Control</p>
          </div>
        </div>
        <div className="h-11 w-11 glass-panel border-glass-border/30 rounded-2xl flex items-center justify-center text-brand shadow-sm">
          <Box size={22} strokeWidth={2.5} />
        </div>
      </header>

      <section>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input 
            type="text" 
            placeholder="Search SKUs, Barcodes, Variants..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-surface-muted border border-glass-border rounded-xl pl-11 pr-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/30"
          />
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between mb-1 px-1">
          <h2 className="text-[10px] font-black text-text-secondary uppercase opacity-60">
            {loading ? 'Refreshing Registry...' : `${filteredVariants.length} Active SKUs`}
          </h2>
          <button onClick={() => { haptics.light(); fetchVariants(); }} className="text-brand">
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-16 w-full glass-panel rounded-2xl animate-pulse bg-surface-muted/50" />
          ))
        ) : filteredVariants.length > 0 ? (
          filteredVariants.map(variant => (
            <VariantListItem 
              key={variant.id} 
              variant={variant} 
              productName={variant.parentName} 
              getImageUrl={api.getImageUrl} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Target size={48} strokeWidth={1} />
            <p className="text-xs font-bold mt-4">No variants registered</p>
          </div>
        )}
      </section>
    </div>
  );
}
