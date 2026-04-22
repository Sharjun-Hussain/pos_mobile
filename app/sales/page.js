"use client";

import React, { useState, useEffect, useReducer, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Package, 
  Tag, 
  ChevronRight,
  ShoppingCart,
  Filter,
  X,
  Store
} from 'lucide-react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { VariantSelector } from '@/components/VariantSelector';

// Cart Reducer matching legacy POS logic
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, isWholesale } = action.payload;
      const price = (isWholesale ? (product.wholesalePrice || 0) : (product.retailPrice || 0)) || 0;
      const existingIndex = state.cart.findIndex(i => i.variantId === product.id);
      
      if (existingIndex > -1) {
        const updated = [...state.cart];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return { ...state, cart: updated };
      }
      
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: product.id,
            productId: product.productId,
            variantId: product.id,
            barcode: product.barcode,
            name: product.fullName,
            size: product.variantName,
            quantity: 1,
            price,
            discount: 0,
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, cart: state.cart.filter(i => i.id !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        cart: state.cart.map(i => {
          if (i.id === action.payload.id) {
            const newQty = Math.max(0, i.quantity + action.payload.delta);
            return { ...i, quantity: newQty };
          }
          return i;
        }).filter(i => i.quantity > 0)
      };
    case 'TOGGLE_WHOLESALE': {
      const { isWholesale, allProducts } = action.payload;
      // Recalculate all cart prices based on mode
      const flatVariants = allProducts.flatMap(p => p.variants);
      return {
        ...state,
        isWholesale,
        cart: state.cart.map(item => {
          const v = flatVariants.find(fv => fv.id === item.variantId);
          if (!v) return item;
          return { ...item, price: isWholesale ? (v.wholesalePrice || 0) : (v.retailPrice || 0) };
        })
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [], isWholesale: false };
    default:
      return state;
  }
}

export default function SalesPage() {
  const [state, dispatch] = useReducer(cartReducer, { cart: [], isWholesale: false });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Variant selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isVariantOpen, setIsVariantOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.products.getActiveList(),
        api.categories.getActiveList()
      ]);

      if (pRes.status === 'success') {
        const rawProducts = pRes.data.data || [];
        const processed = await Promise.all(rawProducts.map(async (p) => {
          const imageUrl = await api.getImageUrl(p.image);
          return {
            id: p.id,
            name: p.name,
            image: imageUrl,
            category: p.main_category?.name || 'General',
            variants: (p.variants || []).map(v => {
              let variantLabel = v.name;
              if (!variantLabel && v.attribute_values?.length > 0) {
                variantLabel = v.attribute_values.map(av => av.value).join(' / ');
              }
              return {
                id: v.id,
                productId: p.id,
                name: p.name,
                variantName: variantLabel || 'Default',
                fullName: variantLabel ? `${p.name} - ${variantLabel}` : p.name,
                barcode: v.barcode || p.barcode,
                retailPrice: parseFloat(v.price) || 0,
                wholesalePrice: parseFloat(v.wholesale_price) || 0,
                image: imageUrl, // Optimization: Use product image for variants mostly
              };
            })
          };
        }));
        setProducts(processed);
      }
      
      if (cRes.status === 'success') {
        setCategories(cRes.data || []);
      }
    } catch (err) {
      setError('Connection failure: Catalog unreachable');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleAddToCart = (product) => {
    if (product.variants?.length > 1) {
      setSelectedProduct(product);
      setIsVariantOpen(true);
    } else if (product.variants?.length === 1) {
      haptics.light();
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { product: product.variants[0], isWholesale: state.isWholesale } 
      });
    }
  };

  const handleVariantSelect = (variant) => {
    haptics.medium();
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { product: variant, isWholesale: state.isWholesale } 
    });
  };

  const toggleWholesale = () => {
    haptics.medium();
    const next = !state.isWholesale;
    dispatch({ type: 'TOGGLE_WHOLESALE', payload: { isWholesale: next, allProducts: products } });
  };

  const handleCheckout = () => {
    haptics.heavy();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      dispatch({ type: 'CLEAR_CART' });
    }, 2500);
  };

  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-surface animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-text-main mb-2">Order Synced</h2>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Transaction finalized in LKR</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* Dynamic Header */}
      <div className="glass-panel mx-4 mt-12 mb-4 p-4 rounded-[2.5rem] flex flex-col gap-4 shadow-xl shadow-black/5 z-50 transition-all">
        <div className="flex items-center justify-between">
          {!showSearch ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                  <Store size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-lg font-black text-text-main leading-tight tracking-tight">Quick Sale</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      {loading ? 'Syncing...' : 'Connected'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { haptics.light(); setShowSearch(true); }}
                  className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
                >
                  <Search size={18} />
                </button>
                <button 
                  onClick={toggleWholesale}
                  className={`h-10 px-3 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-tighter transition-all active:scale-95 border ${
                    state.isWholesale 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                      : 'bg-surface-muted border-glass-border text-text-secondary'
                  }`}
                >
                  <Tag size={14} /> {state.isWholesale ? 'Wholesale' : 'Retail'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-3 animate-in slide-in-from-right duration-300">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search item or SKU..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-surface-muted border border-glass-border rounded-xl pl-10 pr-4 text-xs font-bold text-text-main outline-none focus:border-brand/40"
                />
              </div>
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="h-11 w-11 glass-panel rounded-xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Categories Scroller */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar -mx-4 px-4">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeCategory === 'All' 
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105' 
                : 'bg-surface-muted text-text-secondary border-glass-border'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { haptics.light(); setActiveCategory(cat.name); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCategory === cat.name 
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105' 
                  : 'bg-surface-muted text-text-secondary border-glass-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-72">
        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="glass-panel p-8 rounded-[2.5rem] text-center flex flex-col items-center gap-4 border-rose-500/20 mt-10">
            <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
              <Package size={24} />
            </div>
            <p className="text-sm font-bold text-text-main">{error}</p>
            <button onClick={fetchData} className="btn-primary px-6 h-10 text-xs">Retry Sync</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="mx-auto text-text-secondary/20 mb-4" size={48} />
            <p className="text-text-secondary font-bold text-sm">No items found in this shelf</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className="glass-panel p-3 rounded-[2rem] flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-surface-muted/30 relative border-glass-border group"
              >
                {p.variants?.length > 1 && (
                  <div className="absolute top-2 right-2 p-1.5 bg-brand/10 text-brand rounded-lg shadow-sm">
                    <Filter size={10} strokeWidth={3} />
                  </div>
                )}
                <div className="h-24 w-24 rounded-2xl bg-surface-muted overflow-hidden border border-glass-border shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-text-secondary/20">
                      <Package size={32} />
                    </div>
                  )}
                </div>
                <div className="text-center w-full px-1 flex flex-col gap-1">
                  <span className="font-bold text-text-main text-[11px] leading-tight line-clamp-2 min-h-[2rem]">
                    {p.name}
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-brand tracking-tighter">
                      LKR {parseFloat(p.variants[0]?.retailPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider opacity-60">
                      {p.category}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary (Floating Sheet) - Always visible if items exist */}
      <div className="fixed bottom-24 left-0 right-0 p-4 pt-0 z-[60]">
        <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl border-glass-border bg-surface/90 backdrop-blur-xl transition-all">
          <div className="flex flex-col gap-3 max-h-40 overflow-y-auto mb-4 pr-1 no-scrollbar overflow-x-hidden">
            {state.cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <ShoppingCart className="text-text-secondary/20" size={24} />
                <p className="text-center text-text-secondary font-black uppercase tracking-widest text-[9px]">Shelf empty</p>
              </div>
            ) : (
              state.cart.map(item => (
                <div key={item.id} className="flex items-center justify-between animate-in slide-in-from-left duration-300">
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-black text-text-main text-xs truncate uppercase tracking-tight">{item.name}</span>
                    <span className="text-[9px] text-text-secondary font-bold">LKR {parseFloat(item.price).toLocaleString()} / Unit</span>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-muted/50 rounded-xl p-1 px-3 border border-glass-border ml-4 shadow-inner">
                    <button onClick={() => { haptics.light(); dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, delta: -1 } }); }} className="text-text-secondary active:scale-75 transition-transform"><Minus size={12} /></button>
                    <span className="font-black text-text-main text-xs min-w-[12px] text-center">{item.quantity}</span>
                    <button onClick={() => { haptics.light(); dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, delta: 1 } }); }} className="text-brand active:scale-125 transition-transform"><Plus size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-glass-border pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-text-secondary text-[10px] font-black uppercase tracking-widest leading-none">Checkout Total</span>
                {state.isWholesale && <span className="text-[8px] text-amber-500 font-bold uppercase mt-1">Wholesale Pricing Active</span>}
              </div>
              <span className="text-2xl font-black text-text-main tracking-tighter transition-all">
                LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button className="h-14 w-14 glass-panel rounded-2xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-rose-500" onClick={() => dispatch({ type: 'CLEAR_CART' })}>
                <Trash2 size={20} />
              </button>
              <button 
                onClick={handleCheckout}
                disabled={state.cart.length === 0}
                className="btn-primary flex-1 h-14 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 group transition-all"
              >
                Pay & Sync <CreditCard size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <VariantSelector 
        isOpen={isVariantOpen}
        product={selectedProduct}
        onClose={() => setIsVariantOpen(false)}
        onSelect={handleVariantSelect}
      />
    </div>
  );
}
