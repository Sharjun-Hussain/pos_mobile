"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  X, 
  Printer, 
  RotateCcw, 
  AlertTriangle,
} from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { receiptService } from '@/services/receipt';
import { InvoiceView } from './InvoiceView';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export const SaleDetailsSheet = memo(({ isOpen, onClose, saleId, onReturnTrigger }) => {
  useHardwareBack(isOpen, onClose);
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
    } else if (!isOpen) {
        // Reset state when closed to ensure a clean slate for next time
        setSale(null);
        setLoading(true);
    }
  }, [isOpen, saleId]);

  const fetchSaleDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.sales.getById(saleId);
      setSale(res.data);
    } catch (err) {
      setError('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  const handlePrint = useCallback(() => {
    if (!sale) return;
    haptics.medium();
    receiptService.print(sale);
  }, [sale]);

  return (
    <Drawer.Root 
        open={isOpen} 
        onOpenChange={(c) => !c && onClose()}
        shouldScaleBackground={false} // Disable scaling for performance if requested
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] h-[95%] mt-24 fixed bottom-0 left-0 right-0 z-[501] outline-none shadow-2xl overflow-hidden">
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-glass-border/30 bg-surface">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand/5 text-brand rounded-xl flex items-center justify-center font-black text-lg">
                  #
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-main leading-none mb-1">Sale Invoice</h3>
                  <p className="text-[10px] font-bold text-text-secondary opacity-50">{sale?.invoice_number || 'Loading...'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 bg-surface-muted rounded-xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-muted/30">
              {loading ? (
                <div className="p-8 flex flex-col gap-6 animate-pulse">
                  <div className="h-[500px] w-full bg-surface-muted rounded-2xl shadow-sm" />
                </div>
              ) : error ? (
                <div className="p-12 text-center flex flex-col items-center gap-4 text-rose-500">
                  <AlertTriangle size={48} strokeWidth={1} />
                  <p className="font-bold text-sm text-center px-4">{error}</p>
                  <button onClick={fetchSaleDetails} className="bg-rose-500/10 px-8 h-12 rounded-2xl text-xs font-black uppercase tracking-widest mt-4">Retry</button>
                </div>
              ) : (
                <div className="p-4 sm:p-6 flex flex-col gap-6">
                  <div className="shadow-2xl shadow-black/10 rounded-sm overflow-hidden bg-white">
                     <InvoiceView sale={sale} />
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!loading && !error && sale && (
              <div className="p-6 bg-surface border-t border-glass-border/30 flex gap-3 pb-[calc(var(--sab)+1.5rem)]">
              <button 
                onClick={handlePrint}
                className="btn-primary flex-1 h-14 bg-brand text-white border-0 shadow-lg shadow-brand/20 active:scale-95 transition-all"
              >
                <Printer size={18} />
                <span className="text-sm font-bold">Reprint</span>
              </button>
              <button 
                onClick={() => { haptics.medium(); onReturnTrigger(sale); }}
                className="flex-1 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                <RotateCcw size={18} />
                <span className="text-sm font-bold">Return</span>
              </button>
            </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

SaleDetailsSheet.displayName = 'SaleDetailsSheet';
