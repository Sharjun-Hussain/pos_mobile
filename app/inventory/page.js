"use client";

import React, { useState } from 'react';
import { Search, Filter, Plus, Package, AlertCircle } from 'lucide-react';
import { haptics } from '@/services/haptics';

const products = [
  { id: 1, name: 'Espresso Beans', sku: 'COF-001', price: 24.99, stock: 45, category: 'Coffee' },
  { id: 2, name: 'Whole Milk 1L', sku: 'DAI-023', price: 3.50, stock: 12, category: 'Dairy' },
  { id: 3, name: 'Oat Milk 1L', sku: 'DAI-045', price: 4.20, stock: 5, category: 'Dairy' },
  { id: 4, name: 'Paper Cups (Small)', sku: 'PAC-002', price: 0.15, stock: 150, category: 'Packaging' },
  { id: 5, name: 'Caramel Syrup', sku: 'SYR-009', price: 12.00, stock: 8, category: 'Add-ons' },
];

const ProductListItem = ({ product }) => {
  const isLowStock = product.stock < 10;
  
  return (
    <div className="glass-panel p-4 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${isLowStock ? 'bg-amber-500/10 text-amber-500' : 'bg-brand/10 text-brand'}`}>
          <Package size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100">{product.name}</h4>
          <p className="text-xs text-zinc-500 uppercase tracking-tighter">{product.sku}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-zinc-100">${product.price.toFixed(2)}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          {isLowStock && <AlertCircle size={10} className="text-amber-500" />}
          <span className={`text-[10px] font-bold uppercase ${isLowStock ? 'text-amber-500' : 'text-zinc-500'}`}>
            {product.stock} in stock
          </span>
        </div>
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Inventory</h1>
          <p className="text-zinc-500 text-sm font-medium">Manage your products</p>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-zinc-100 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <button className="h-14 w-14 glass-panel rounded-2xl flex items-center justify-center text-zinc-500 active:bg-white/10">
          <Filter size={20} />
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest ml-1">
            {filteredProducts.length} Products
          </h2>
        </div>
        {filteredProducts.map(product => (
          <ProductListItem key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
