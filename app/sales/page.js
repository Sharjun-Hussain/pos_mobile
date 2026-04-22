"use client";

import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { scanner } from '@/services/scanner';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { VariantSelector } from '@/components/VariantSelector';
import { CheckoutSheet } from '@/components/CheckoutSheet';
import { useRouter } from 'next/navigation';

// Optimized Sub-Components
import TerminalHeader from '@/components/pos/TerminalHeader';
import CategoryBar from '@/components/pos/CategoryBar';
import ProductCard from '@/components/pos/ProductCard';
import DockedCart from '@/components/pos/DockedCart';

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
      setError('Catalog Sync Failed');
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

  // STABLE HANDLERS (Optimized for Mobile/Tablet)
  const handleAddToCart = useCallback((product) => {
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
  }, [state.isWholesale]);

  const scanBarcode = useCallback(async () => {
    haptics.medium();
    const result = await scanner.startScan();
    if (result) {
      const allVariants = products.flatMap(p => p.variants);
      const match = allVariants.find(v => v.barcode === result);
      
      if (match) {
        dispatch({ 
          type: 'ADD_ITEM', 
          payload: { product: match, isWholesale: state.isWholesale } 
        });
        haptics.heavy();
      } else {
        alert('Product Not Found: ' + result);
      }
    }
  }, [products, state.isWholesale]);

  const handleVariantSelect = useCallback((variant) => {
    haptics.medium();
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { product: variant, isWholesale: state.isWholesale } 
    });
  }, [state.isWholesale]);

  const toggleWholesale = useCallback(() => {
    haptics.medium();
    const flatVariants = products.flatMap(p => p.variants);
    dispatch({ 
      type: 'TOGGLE_WHOLESALE', 
      payload: { isWholesale: !state.isWholesale, flatVariants } 
    });
  }, [state.isWholesale, products]);

  const handleFinishSale = useCallback((customer) => {
    setIsCheckoutOpen(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      dispatch({ type: 'CLEAR_CART' });
    }, 2500);
  }, []);

  const total = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [state.cart]);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-surface animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <div className="h-10 w-10 border-4 border-white rounded-full border-t-transparent animate-spin" />
        </div>
        <h2 className="text-3xl font-bold text-text-main mb-2">Order Confirmed</h2>
        <p className="text-text-secondary font-bold text-xs">Transaction synchronized successfully</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      
      <header className="fixed top-0 left-0 right-0 z-50 pt-12 p-4 flex flex-col gap-4 glass-panel border-b border-glass-border">
        <TerminalHeader 
          showSearch={showSearch}
          onToggleSearch={setShowSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScan={scanBarcode}
          onToggleWholesale={toggleWholesale}
          isWholesale={state.isWholesale}
          onBack={() => router.back()}
        />

        <CategoryBar 
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </header>

      {/* Main Grid - Padded for Header and Footer */}
      <div className="flex-1 overflow-y-auto px-4 pb-48 pt-44 overscroll-contain no-scrollbar">
        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="glass-panel p-10 rounded-[3rem] text-center flex flex-col items-center gap-4 border-rose-500/20 mt-10 shadow-2xl">
            <p className="text-sm font-bold text-text-main">{error}</p>
            <button onClick={fetchData} className="btn-primary px-8 h-12 text-xs font-bold transition-all">Retry Sync</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <p className="text-xs font-bold text-text-main">No matches in this shelf</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(p => (
              <ProductCard 
                key={p.id}
                product={p}
                onAdd={handleAddToCart}
                isWholesale={state.isWholesale}
              />
            ))}
          </div>
        )}
      </div>

      <DockedCart 
        cart={state.cart}
        total={total}
        onClick={() => { haptics.medium(); setIsCheckoutOpen(true); }}
        isVisible={state.cart.length > 0}
      />

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
