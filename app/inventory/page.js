"use client"
import { Search, Filter, Plus, Package, AlertCircle, Menu, RefreshCcw, Box } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';

const ProductListItem = ({ product, getImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isLowStock = product.stock_quantity < 10;

  useEffect(() => {
    if (product.image) {
      getImageUrl(product.image).then(setImageUrl);
    }
  }, [product.image, getImageUrl]);

  return (
    <div className="glass-panel p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${isLowStock ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'
          }`}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={20} strokeWidth={2.5} />
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-[13px] truncate leading-tight">{product.name || product.fullName}</h4>
          <p className="text-[10px] font-bold text-text-secondary truncate opacity-60">
            {product.sku || product.barcode || 'No SKU'}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-brand text-xs">LKR {(parseFloat(product.retailPrice) || 0).toLocaleString()}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {isLowStock && <AlertCircle size={10} className="text-rose-500 shadow-sm" strokeWidth={3} />}
          <span className={`text-[10px] font-black ${isLowStock ? 'text-rose-500' : 'text-text-secondary opacity-80'}`}>
            {product.stock_quantity || 0} units
          </span>
        </div>
      </div>
    </div>
  );
};

export default function InventoryPage() {
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
        api.products.getActiveList(),
        api.categories.getActiveList()
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || p.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 pb-24 flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main leading-none mb-1">Inventory</h1>
            <p className="text-[10px] font-bold text-text-secondary leading-none opacity-40">Global Stock Hub</p>
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
            placeholder="Search SKU or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-surface-muted border border-glass-border/50 rounded-2xl pl-12 pr-4 text-text-main outline-none focus:border-brand/40 transition-all text-sm font-medium placeholder:text-text-secondary/50"
          />
        </div>
        <button
          onClick={() => { haptics.light(); fetchData(); }}
          className="h-14 w-14 glass-panel border-glass-border/30 rounded-2xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      {/* Category Filter Pills */}
      <section className="overflow-x-auto no-scrollbar flex gap-2 -mx-6 px-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 h-9 rounded-full text-[10px] font-black transition-all ${!selectedCategory
            ? 'bg-brand text-white shadow-lg shadow-brand/20'
            : 'glass-panel text-text-secondary border-glass-border/40'
            }`}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 h-9 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${selectedCategory === cat.id
              ? 'bg-brand text-white shadow-lg shadow-brand/20'
              : 'glass-panel text-text-secondary border-glass-border/40'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between mb-1 px-1">
          <h2 className="text-[10px] font-black text-text-secondary opacity-40">
            {loading ? 'Refreshing...' : `${filteredProducts.length} items in stock`}
          </h2>
          {error && <span className="text-[10px] font-black text-rose-500 uppercase">{error}</span>}
        </div>

        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 w-full glass-panel rounded-2xl animate-pulse bg-surface-muted/50" />
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductListItem key={product.id} product={product} getImageUrl={api.getImageUrl} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Box size={48} strokeWidth={1} />
            <p className="text-xs font-bold mt-4">No matching items found</p>
          </div>
        )}
      </section>
    </div>
  );
}
