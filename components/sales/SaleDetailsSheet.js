"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  RotateCcw, 
  ChevronRight, 
  User, 
  MapPin, 
  Clock, 
  Database,
  CheckCircle2,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { receiptService } from '@/services/receipt';

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
          className="relative bg-white rounded-t-[2.5rem] w-full max-h-[92vh] flex flex-col shadow-2xl safe-area-inset-bottom"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand/5 text-brand rounded-xl flex items-center justify-center">
                <Receipt size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-main leading-none mb-1">Invoice Details</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{sale?.invoice_number || 'Loading...'}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-9 w-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 active:rotate-90 transition-transform"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-8 flex flex-col gap-6 animate-pulse">
                <div className="h-20 w-full bg-slate-50 rounded-2xl" />
                <div className="h-40 w-full bg-slate-50 rounded-2xl" />
                <div className="h-32 w-full bg-slate-50 rounded-2xl" />
              </div>
            ) : error ? (
              <div className="p-12 text-center flex flex-col items-center gap-4 text-rose-500">
                <AlertTriangle size={48} strokeWidth={1} />
                <p className="font-bold text-sm">{error}</p>
                <button onClick={fetchSaleDetails} className="bg-rose-50 px-6 h-10 rounded-xl text-xs font-black uppercase">Retry</button>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-6">
                {/* Status & Highlights */}
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Total Amount</p>
                    <p className="text-xl font-black text-brand">LKR {Math.round(sale.payable_amount).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    sale.payment_status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {sale.payment_status}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Clock size={12} />
                      <p className="text-[9px] font-black uppercase">Date & Time</p>
                    </div>
                    <p className="text-[11px] font-bold text-text-main">
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <MapPin size={12} />
                      <p className="text-[9px] font-black uppercase">Branch</p>
                    </div>
                    <p className="text-[11px] font-bold text-text-main">
                      {sale.branch?.name || 'Main Warehouse'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <User size={12} />
                      <p className="text-[9px] font-black uppercase">Customer</p>
                    </div>
                    <p className="text-[11px] font-bold text-text-main">
                      {sale.customer?.name || 'Walk-in Guest'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Database size={12} />
                      <p className="text-[9px] font-black uppercase">Payment</p>
                    </div>
                    <p className="text-[11px] font-bold text-text-main uppercase">
                      {sale.payment_method}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Items Purchased</p>
                  <div className="bg-slate-50/30 rounded-2xl border border-slate-100 overflow-hidden">
                    {sale.items?.map((item, idx) => (
                      <div key={item.id} className={`flex items-center justify-between p-4 ${idx !== sale.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-[12px] font-bold text-text-main truncate">
                            {item.product?.name}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {item.variant?.name || 'Standard'} • {item.quantity} x LKR {Math.round(item.unit_price).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-[12px] font-black text-text-main ml-4">
                          LKR {Math.round(item.total_amount).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col gap-3 shadow-xl">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase">Subtotal</span>
                    <span className="text-xs font-bold">LKR {Math.round(sale.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span className="text-[10px] font-black uppercase">Total Discount</span>
                    <span className="text-xs font-bold">- LKR {Math.round(sale.discount_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase">Tax Contribution</span>
                    <span className="text-xs font-bold">LKR {Math.round(sale.tax_amount).toLocaleString()}</span>
                  </div>
                  <div className="h-[1px] bg-white/10 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase">Final Net</span>
                    <span className="text-lg font-black text-brand-light">LKR {Math.round(sale.payable_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          {!loading && !error && sale && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-text-main active:scale-95 transition-all shadow-sm"
              >
                <Printer size={18} />
                <span className="text-[13px] font-black">Reprint</span>
              </button>
              <button 
                onClick={() => { haptics.medium(); onReturnTrigger(sale); }}
                className="flex-1 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
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
