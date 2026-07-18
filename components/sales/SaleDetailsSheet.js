"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  Printer,
  RotateCcw,
  AlertTriangle,
  PrinterCheck,
} from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from "@/services/haptics";
import { api } from "@/services/api";
import { receiptService } from '@/services/receipt';
import { InvoiceView } from './InvoiceView';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';



export const SaleDetailsSheet = memo(({ isOpen, onClose, saleId, initialSaleData, onReturnTrigger }) => {
  useHardwareBack(isOpen, onClose);
  const [sale, setSale] = useState(initialSaleData || null);
  const [loading, setLoading] = useState(!initialSaleData);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { paperWidth } = useSettingsStore();
  const isManufacturing = (user?.organization?.business_type || "").toLowerCase() === 'manufacturing' || (user?.organization?.business_type || "").toLowerCase() === 'manufacturer';
  const isA4 = paperWidth === 'A4';

  useEffect(() => {
    if (isOpen) {
      if (initialSaleData) {
        setSale(initialSaleData);
        setLoading(false);
      } else if (saleId) {
        fetchSaleDetails();
      }
    } else {
      // Reset state when closed to ensure a clean slate for next time
      setSale(null);
      setLoading(true);
    }
  }, [isOpen, saleId, initialSaleData]);

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

  const handlePrint = useCallback(async () => {
    if (!sale) return;
    haptics.medium();
    setIsDownloading(true);
    try {
      await receiptService.print(sale, t);
    } finally {
      setIsDownloading(false);
    }
  }, [sale, t]);

  const handleNativePrint = useCallback(async () => {
    if (!sale) return;
    haptics.medium();
    setIsPrinting(true);
    try {
      await receiptService.printDirect(sale, t);
    } finally {
      setIsPrinting(false);
    }
  }, [sale, t]);

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
                  {((sale.returns?.length > 0) || (sale.sale_returns?.length > 0) || (sale.return_status && sale.return_status !== 'none')) && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl flex items-start gap-4">
                      <div className="h-10 w-10 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                        <RotateCcw size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-orange-700 uppercase mb-1">Return Information</h4>
                        <p className="text-[11px] font-bold text-orange-600/80 leading-relaxed">
                          This transaction has associated returns. Total refunded:
                          <span className="text-orange-700 ml-1">
                            LKR {Math.round(
                              (sale.returns || sale.sale_returns || []).reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0)
                            ).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-brand/5 to-transparent border border-brand/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-inner h-[300px] relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative h-24 w-24 rounded-full bg-white shadow-xl shadow-brand/10 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-2 border-brand/20 animate-pulse"></div>
                      <PrinterCheck size={40} className="text-brand" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-black text-text-main mb-3 tracking-tight">Transaction Complete</h3>
                    <p className="text-[13px] font-semibold text-text-secondary/70 max-w-[250px] leading-relaxed">
                      The sale has been successfully recorded. Tap below to print the receipt or download a PDF copy.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar - Modern Vertical Stack */}
            {!loading && !error && sale && (
              <div className="p-6 bg-surface/80 backdrop-blur-xl border-t border-glass-border/30 flex flex-col gap-3 pb-[calc(var(--sab)+2rem)]">
                <div className="flex gap-3">
                  {/* Download / Reprint */}
                  <button
                    onClick={handlePrint}
                    disabled={isDownloading || isPrinting}
                    className="flex-1 h-14 bg-surface text-text-main border border-glass-border/50 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 group"
                  >
                    {isDownloading ? (
                      <div className="h-5 w-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Printer size={18} className="text-text-secondary group-hover:text-brand transition-colors" />
                        <span className="text-sm font-bold tracking-wide">{isA4 ? 'Download A4' : 'Reprint PDF'}</span>
                      </>
                    )}
                  </button>

                  {/* Direct Print (Bluetooth / LAN) */}
                  {!isA4 && (
                    <button
                      onClick={handleNativePrint}
                      disabled={isDownloading || isPrinting}
                      className="flex-[1.5] h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:active:scale-100 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                      {isPrinting ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
                      ) : (
                        <>
                          <PrinterCheck size={20} className="relative z-10" />
                          <span className="text-sm font-bold tracking-wide relative z-10">Thermal Print</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {onReturnTrigger ? (
                  <button
                    onClick={() => { haptics.medium(); onReturnTrigger(sale); }}
                    className="w-full h-14 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center gap-2 border border-rose-500/20 shadow-sm hover:bg-rose-500 hover:text-white active:scale-95 transition-all duration-300"
                  >
                    <RotateCcw size={18} />
                    <span className="text-sm font-bold tracking-wide">Initiate Return</span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full h-14 bg-surface-muted text-text-main rounded-2xl flex items-center justify-center gap-2 border border-glass-border shadow-sm hover:bg-black/5 active:scale-95 transition-all duration-300"
                  >
                    <span className="text-sm font-bold tracking-wide">Done</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

SaleDetailsSheet.displayName = 'SaleDetailsSheet';
