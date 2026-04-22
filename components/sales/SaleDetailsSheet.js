"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  RotateCcw, 
  AlertTriangle,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { receiptService } from '@/services/receipt';
import { InvoiceView } from './InvoiceView';

export const SaleDetailsSheet = ({ isOpen, onClose, saleId, onReturnTrigger }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  const fetchSaleDetails = async () => {
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
  };

  const handlePrint = () => {
    if (!sale) return;
    haptics.medium();
    receiptService.print(sale);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex flex-col justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="relative bg-surface rounded-t-[2.5rem] w-full max-h-[92vh] flex flex-col shadow-2xl safe-area-inset-bottom overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-glass-border/30 bg-surface z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand/5 text-brand rounded-xl flex items-center justify-center font-black text-lg">
                #
              </div>
              <div>
                <h3 className="text-base font-black text-text-main leading-none mb-1">Sale Invoice</h3>
                <p className="text-[10px] font-bold text-text-secondary opacity-50">{sale?.invoice_number || 'Loading...'}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-9 w-9 bg-surface-muted rounded-lg flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-muted/30">
            {loading ? (
              <div className="p-8 flex flex-col gap-6 animate-pulse">
                <div className="h-[500px] w-full bg-surface-muted rounded-2xl shadow-sm" />
              </div>
            ) : error ? (
              <div className="p-12 text-center flex flex-col items-center gap-4 text-rose-500">
                <AlertTriangle size={48} strokeWidth={1} />
                <p className="font-bold text-sm">{error}</p>
                <button onClick={fetchSaleDetails} className="bg-rose-500/10 px-6 h-10 rounded-xl text-xs font-black">Retry</button>
              </div>
            ) : (
              <div className="p-4 sm:p-6 flex flex-col gap-6">
                <div className="shadow-2xl shadow-black/10 rounded-sm overflow-hidden">
                   <InvoiceView sale={sale} />
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          {!loading && !error && sale && (
            <div className="p-6 bg-surface border-t border-glass-border/30 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 h-14 bg-surface-muted border border-glass-border/50 rounded-2xl flex items-center justify-center gap-3 text-text-main active:scale-95 transition-all shadow-sm"
              >
                <Printer size={18} />
                <span className="text-[13px] font-black">Reprint</span>
              </button>
              <button 
                onClick={() => { haptics.medium(); onReturnTrigger(sale); }}
                className="flex-1 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <RotateCcw size={18} />
                <span className="text-[13px] font-black">Return</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
