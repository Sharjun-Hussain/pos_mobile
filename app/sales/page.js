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
  Store,
  ArrowLeft,
  Camera,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { scanner } from '@/services/scanner';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { VariantSelector } from '@/components/VariantSelector';
import { CheckoutSheet } from '@/components/CheckoutSheet';
import { useRouter } from 'next/navigation';

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
      const { isWholesale, flatVariants } = action.payload;
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
  const router = useRouter();
  const [state, dispatch] = useReducer(cartReducer, { cart: [], isWholesale: false });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Dialog/Sheet states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
                image: imageUrl,
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
      setError('Sync failed: Catalog unavailable');
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

  const scanBarcode = async () => {
    haptics.medium();
    const result = await scanner.startScan();
    if (result) {
      // Find matching variant
      const allVariants = products.flatMap(p => p.variants);
      const match = allVariants.find(v => v.barcode === result);
      
      if (match) {
        dispatch({ 
          type: 'ADD_ITEM', 
          payload: { product: match, isWholesale: state.isWholesale } 
        });
        haptics.heavy();
      } else {
        alert('Product not found: ' + result);
      }
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
    const flatVariants = products.flatMap(p => p.variants);
    dispatch({ type: 'TOGGLE_WHOLESALE', payload: { isWholesale: next, flatVariants } });
  };

  const handleFinishSale = (customer) => {
    setIsCheckoutOpen(false);
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
        <h2 className="text-3xl font-black text-text-main mb-2">Order Confirmed</h2>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Transaction synchronized successfully</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      
      {/* PROFESSIONAL TOP TERMINAL BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-12 p-4 flex flex-col gap-4 glass-panel border-b border-glass-border">
        <div className="flex items-center justify-between">
          {!showSearch ? (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-text-secondary">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-sm font-black text-text-main uppercase tracking-widest leading-none">POS Terminal</h1>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1 tracking-wider flex items-center gap-1">
                    <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" /> Live Node
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={scanBarcode}
                  className="h-12 px-4 bg-brand text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-brand/20 active:scale-95 transition-all"
                >
                  <Camera size={18} strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Scan</span>
                </button>
                <button 
                  onClick={() => setShowSearch(true)}
                  className="h-12 w-12 glass-panel rounded-2xl flex items-center justify-center text-text-secondary active:scale-90"
                >
                  <Search size={18} />
                </button>
                <div className="h-8 w-[1px] bg-glass-border mx-1" />
                <button 
                  onClick={toggleWholesale}
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${
                    state.isWholesale 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                      : 'bg-surface-muted border-glass-border text-text-secondary opacity-60'
                  }`}
                >
                  <Tag size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-3 animate-in slide-in-from-right duration-300">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Quick Search Product..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-xs font-bold text-text-main outline-none focus:border-brand/40 shadow-inner"
                />
              </div>
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="h-12 w-12 glass-panel rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Categories Bar - Minimized */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar -mx-2 px-2 pb-1">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
              activeCategory === 'All' 
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' 
                : 'bg-surface-muted/30 text-text-secondary border-glass-border'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { haptics.light(); setActiveCategory(cat.name); }}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeCategory === cat.name 
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' 
                  : 'bg-surface-muted/30 text-text-secondary border-glass-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid - Padded for Header and Footer */}
      <div className="flex-1 overflow-y-auto px-4 pb-48 pt-48">
        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="glass-panel p-10 rounded-[3rem] text-center flex flex-col items-center gap-4 border-rose-500/20 mt-10 shadow-2xl">
            <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
              <RotateCcw size={32} className="animate-spin-slow" />
            </div>
            <p className="text-sm font-black text-text-main uppercase tracking-widest">{error}</p>
            <button onClick={fetchData} className="btn-primary px-8 h-12 text-xs font-black uppercase tracking-widest">Retry Node Sync</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <Package size={64} className="mx-auto mb-6" />
            <p className="text-xs font-black uppercase tracking-widest">No structural matches</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className="glass-panel p-2 rounded-[1.75rem] flex flex-col items-center gap-2 active:scale-95 transition-all border-glass-border group relative aspect-[4/5]"
              >
                {p.variants?.length > 1 && (
                  <div className="absolute top-1.5 right-1.5 p-1 bg-brand/10 text-brand rounded-lg shadow-sm border border-brand/20">
                    <Maximize2 size={8} strokeWidth={4} />
                  </div>
                )}
                <div className="w-full aspect-square rounded-2xl bg-surface-muted overflow-hidden border border-glass-border shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-text-secondary/10">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="text-center w-full px-1 flex flex-col">
                  <span className="font-bold text-text-main text-[9px] leading-[1.1] mb-1 line-clamp-2 h-[1.1rem]">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-black text-brand tracking-tighter">
                    LKR{parseFloat(p.variants[0]?.retailPrice || 0).toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DOCKED MINIMAL CART BAR (Wizard Phase 1) */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-[90]">
        <button 
          onClick={() => { haptics.medium(); setIsCheckoutOpen(true); }}
          className={`w-full h-18 glass-panel rounded-[2rem] p-4 flex items-center justify-between shadow-2xl transition-all active:scale-95 border-brand/30 shadow-brand/10 ${
            state.cart.length === 0 ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/30">
              <ShoppingCart size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-text-main uppercase tracking-tighter">{state.cart.length} Items Selected</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">LKR {total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-2">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Review Cart</span>
            <ChevronRight size={18} className="text-brand animate-pulse" />
          </div>
        </button>
      </div>

      {/* MODALS */}
      <VariantSelector 
        isOpen={isVariantOpen}
        product={selectedProduct}
        onClose={() => setIsVariantOpen(false)}
        onSelect={handleVariantSelect}
      />

      <CheckoutSheet 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={state.cart}
        isWholesale={state.isWholesale}
        onUpdateQty={(id, delta) => dispatch({ type: 'UPDATE_QTY', payload: { id, delta } })}
        onRemove={(id) => dispatch({ type: 'REMOVE_ITEM', payload: id })}
        onClear={() => dispatch({ type: 'CLEAR_CART' })}
        onFinish={handleFinishSale}
      />
    </div>
  );
}
