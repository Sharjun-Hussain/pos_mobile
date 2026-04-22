"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { scanner } from '@/services/scanner';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { VariantSelector } from '@/components/VariantSelector';
import { CheckoutSheet } from '@/components/CheckoutSheet';
import { useRouter } from 'next/navigation';
import { Toast } from '@capacitor/toast';
import { receiptService } from '@/services/receipt';

// Optimized Sub-Components
import TerminalHeader from '@/components/pos/TerminalHeader';
import CategoryBar from '@/components/pos/CategoryBar';
import ProductCard from '@/components/pos/ProductCard';
import DockedCart from '@/components/pos/DockedCart';

// Global Stores
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';

export default function SalesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  // Zustand States
  const { cart, addItem, syncPrices } = useCartStore();
  const { isWholesale, toggleWholesale, activeCategory, setActiveCategory } = useSettingsStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        const rawProducts = pRes.data || [];
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

  // STABLE HANDLERS
  const handleAddToCart = useCallback((product) => {
    if (product.variants?.length > 1) {
      setSelectedProduct(product);
      setIsVariantOpen(true);
    } else if (product.variants?.length === 1) {
      haptics.light();
      addItem(product.variants[0], isWholesale);
    }
  }, [isWholesale, addItem]);

  const scanBarcode = useCallback(async () => {
    haptics.medium();
    const result = await scanner.startScan();
    if (result) {
      const allVariants = products.flatMap(p => p.variants);
      const match = allVariants.find(v => v.barcode === result);
      
      if (match) {
        addItem(match, isWholesale);
        haptics.heavy();
      } else {
        alert('Product Not Found: ' + result);
      }
    }
  }, [products, isWholesale, addItem]);

  const handleVariantSelect = useCallback((variant) => {
    haptics.medium();
    addItem(variant, isWholesale);
  }, [isWholesale, addItem]);

  const handleToggleWholesale = useCallback(() => {
    haptics.medium();
    const next = !isWholesale;
    toggleWholesale();
    const flatVariants = products.flatMap(p => p.variants);
    syncPrices(next, flatVariants);
  }, [isWholesale, products, toggleWholesale, syncPrices]);

  const handleFinishSale = useCallback(async (saleData) => {
    setIsCheckoutOpen(false);
    
    // Auto-print receipt
    if (saleData) {
      receiptService.print(saleData);
    }
    
    // Show native toast
    await Toast.show({
      text: t('common.success') || 'Sale Completed Successfully',
      duration: 'long'
    });
  }, [t]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      
      <header className="fixed top-0 left-0 right-0 z-50 pt-12 p-4 flex flex-col gap-4 glass-panel border-b border-glass-border">
        <TerminalHeader 
          showSearch={showSearch}
          onToggleSearch={setShowSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScan={scanBarcode}
          onToggleWholesale={handleToggleWholesale}
          isWholesale={isWholesale}
          onBack={() => router.back()}
        />

        <CategoryBar 
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-48 pt-44 overscroll-contain no-scrollbar">
        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="glass-panel p-10 rounded-[3rem] text-center flex flex-col items-center gap-4 border-rose-500/20 mt-10 shadow-2xl">
            <p className="text-sm font-bold text-text-main">{t('common.error')}</p>
            <button onClick={fetchData} className="btn-primary px-8 h-12 text-xs font-bold">{t('pos.retry')}</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <p className="text-xs font-bold text-text-main">{t('pos.noMatches')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(p => (
              <ProductCard 
                key={p.id}
                product={p}
                onAdd={handleAddToCart}
                isWholesale={isWholesale}
              />
            ))}
          </div>
        )}
      </div>

      <DockedCart 
        cart={cart}
        total={total}
        onClick={() => { haptics.medium(); setIsCheckoutOpen(true); }}
        isVisible={cart.length > 0}
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
        onFinish={handleFinishSale}
      />
    </div>
  );
}
