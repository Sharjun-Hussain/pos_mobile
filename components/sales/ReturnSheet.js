"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Undo2,
  DollarSign
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';

export const ReturnSheet = ({ isOpen, onClose, sale, onFinish }) => {
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sale) {
      // Initialize return items with 0 quantity initially
      setReturnItems(sale.items.map(item => ({
        ...item,
        return_quantity: 0,
        reason: 'Change of mind'
      })));
      setRefundMethod(sale.payment_method === 'cash' ? 'cash' : 'bank');
      setError(null);
    }
  }, [isOpen, sale]);

  const updateQuantity = (itemId, delta) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, Math.min(item.quantity, item.return_quantity + delta));
        if (newQty !== item.return_quantity) haptics.light();
        return { ...item, return_quantity: newQty };
      }
      return item;
    }));
  };

  const totalRefund = returnItems.reduce((sum, item) => 
    sum + (item.return_quantity * item.unit_price), 0
  );

  const hasItemsToReturn = totalRefund > 0;

  const handleSubmit = async () => {
    if (!hasItemsToReturn || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    haptics.medium();

    try {
      const payload = {
        sale_id: sale.id,
        refund_amount: totalRefund,
        refund_method: refundMethod,
        notes: notes || `Return for Invoice ${sale.invoice_number}`,
        items: returnItems
          .filter(item => item.return_quantity > 0)
          .map(item => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            quantity: item.return_quantity,
            reason: item.reason
          }))
      };

      const res = await api.sales.returns.create(payload);
      if (res.status === 'success') {
        haptics.heavy();
        onFinish();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Refund processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex flex-col justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="relative bg-surface rounded-t-[2.5rem] w-full max-h-[94vh] flex flex-col shadow-2xl safe-area-inset-bottom"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-glass-border/30">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                <RotateCcw size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-main leading-none mb-1">Process Return</h3>
                <p className="text-[10px] font-bold text-text-secondary opacity-50">Invoice: {sale.invoice_number}</p>
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

            {/* Selection List */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest pl-1">Select Items & Qty</p>
              <div className="flex flex-col gap-2">
                {returnItems.map(item => (
                  <div key={item.id} className="bg-surface-muted p-4 rounded-2xl border border-glass-border/20 flex items-center justify-between">
                    <div className="flex-1 overflow-hidden pr-4">
                      <h4 className="text-[12px] font-bold text-text-main truncate">{item.product?.name}</h4>
                      <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-0.5 uppercase">Purchased: {item.quantity}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className={`text-text-secondary opacity-20 active:scale-90 transition-transform ${item.return_quantity > 0 ? 'text-rose-500 opacity-100' : ''}`}
                      >
                        <MinusCircle size={22} />
                      </button>
                      <span className={`text-sm font-black w-4 text-center ${item.return_quantity > 0 ? 'text-text-main' : 'text-text-secondary opacity-20'}`}>
                        {item.return_quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className={`text-text-secondary opacity-20 active:scale-90 transition-transform ${item.return_quantity < item.quantity ? 'text-brand opacity-100' : ''}`}
                      >
                        <PlusCircle size={22} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Configuration */}
            <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest pl-1">Refund Method</p>
                  <div className="flex gap-2">
                    {['cash', 'bank'].map(method => (
                      <button
                        key={method}
                        onClick={() => { haptics.light(); setRefundMethod(method); }}
                        className={`flex-1 h-12 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                          refundMethod === method 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' 
                            : 'bg-surface-muted text-text-secondary opacity-40 border-glass-border/20'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest pl-1">Reason / Notes</p>
                  <textarea 
                    placeholder="Enter return reason..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 bg-surface-muted border border-glass-border/20 rounded-2xl p-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40 placeholder:text-text-secondary/30"
                  />
               </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-rose-500 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-rose-500/20 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black opacity-60 leading-none uppercase tracking-widest">Net Refund Amount</span>
                <span className="text-xl font-black">LKR {Math.round(totalRefund).toLocaleString()}</span>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <DollarSign size={20} />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-6 pt-0">
            <button 
              disabled={!hasItemsToReturn || isSubmitting}
              onClick={handleSubmit}
              className="w-full h-12 bg-brand text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} strokeWidth={3} />
                  <span className="text-[15px] font-black uppercase tracking-widest">Finish Return</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
