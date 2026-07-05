"use client";

import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  PackageOpen
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { Toast } from '@capacitor/toast';
import { useAuthStore } from '@/store/useAuthStore';

// We need an api client here to fetch products and submit
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const CreateWastageSheet = ({ isOpen, onClose, onSuccess }) => {
  useHardwareBack(isOpen, onClose);
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { token, selectedBranch } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('');
    setReason('');
    setNotes('');
    setSearch('');
    setError(null);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/active/list${selectedBranch?.id ? '?branch_id=' + selectedBranch.id : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || !reason) {
      setError('Please select a product, enter quantity and reason.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    haptics.medium();

    try {
      const payload = {
        branch_id: selectedBranch?.id,
        product_id: selectedProduct.id,
        product_variant_id: null,
        quantity: parseFloat(quantity),
        wastage_type: 'finished_good',
        reason,
        notes
      };

      const res = await fetch(`${API_BASE_URL}/wastages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        haptics.success();
        await Toast.show({
          text: 'Wastage recorded successfully',
          duration: 'short',
          position: 'bottom'
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(data.message || 'Failed to record wastage');
      }
    } catch (err) {
      setError(err.message || 'Error occurred');
      haptics.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl max-h-[95dvh] pb-[calc(var(--sab)+1rem)]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 pb-4 flex items-center justify-between border-b border-glass-border/30">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-main leading-none mb-1">Log Wastage</h3>
                  <p className="text-[10px] font-bold text-text-secondary opacity-50">Record damaged or expired stock</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="h-9 w-9 bg-surface-muted rounded-lg flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-6">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-500">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <p className="text-[11px] font-bold py-0.5">{error}</p>
                </div>
              )}

              {!selectedProduct ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
                    <input
                      type="text"
                      placeholder="Search product to waste..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:border-rose-500/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                    {loading ? (
                      <p className="text-xs text-center p-4 text-text-secondary">Loading products...</p>
                    ) : filteredProducts.slice(0, 20).map(p => (
                      <div 
                        key={p.id}
                        onClick={() => { haptics.light(); setSelectedProduct(p); }}
                        className="flex items-center gap-3 p-3 bg-surface-muted rounded-2xl border border-glass-border/20 active:bg-rose-500/5 cursor-pointer"
                      >
                        <div className="h-10 w-10 bg-surface rounded-xl flex items-center justify-center text-text-secondary border border-glass-border/30">
                          <PackageOpen size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-main">{p.name}</h4>
                          <p className="text-[10px] font-bold text-text-secondary opacity-50">Stock: {p.stock_quantity || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="bg-surface-muted p-4 rounded-2xl border border-glass-border/20 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-text-main">{selectedProduct.name}</h4>
                      <p className="text-[10px] font-bold text-text-secondary opacity-50">Available: {selectedProduct.stock_quantity || 0}</p>
                    </div>
                    <button 
                      onClick={() => { haptics.light(); setSelectedProduct(null); }}
                      className="text-[10px] font-black uppercase text-rose-500 px-3 py-1.5 bg-rose-500/10 rounded-lg active:scale-95 transition-transform"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-secondary pl-1 uppercase tracking-wider">Quantity</label>
                    <input 
                      type="number"
                      placeholder="Amount to deduct..."
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-rose-500/40 focus:bg-surface transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-secondary pl-1 uppercase tracking-wider">Reason</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {['Damaged', 'Expired', 'Lost', 'Quality Failed'].map(r => (
                        <button
                          key={r}
                          onClick={() => { haptics.light(); setReason(r); }}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black border transition-all ${reason === r ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-surface-muted border-glass-border/20 text-text-secondary'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      placeholder="Or type custom reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-sm font-bold text-text-main outline-none focus:border-rose-500/40 focus:bg-surface transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-secondary pl-1 uppercase tracking-wider">Notes (Optional)</label>
                    <textarea 
                      placeholder="Additional details..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-20 bg-surface-muted border border-glass-border/30 rounded-xl p-4 text-sm font-bold text-text-main outline-none focus:border-rose-500/40 focus:bg-surface transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="p-6 pt-0 mt-auto">
              <button 
                disabled={!selectedProduct || !quantity || !reason || isSubmitting}
                onClick={handleSubmit}
                className="w-full h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} strokeWidth={3} />
                    <span className="text-[15px] font-black">Confirm Wastage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
