"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  Printer,
  RotateCcw,
  AlertTriangle,
  PrinterCheck,
  Share2,
  Download,
  User,
  Package
} from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from "@/services/haptics";
import { api } from "@/services/api";
import { receiptService } from '@/services/receipt';
import { InvoiceView } from './InvoiceView';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrency } from '@/hooks/useCurrency';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';


export const SaleDetailsSheet = memo(({ isOpen, onClose, saleId, initialSaleData, onReturnTrigger }) => {
  useHardwareBack(isOpen, onClose);
  const [sale, setSale] = useState(initialSaleData || null);
  const [loading, setLoading] = useState(!initialSaleData);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { paperWidth } = useSettingsStore();
  const { formatCurrency } = useCurrency();
  const isManufacturing = (user?.organization?.business_type || "").toLowerCase() === 'manufacturing' || (user?.organization?.business_type || "").toLowerCase() === 'manufacturer';
  const isA4 = paperWidth === 'A4';

  useEffect(() => {
    if (isOpen) {
      if (initialSaleData) {
        setSale(initialSaleData);
        setLoading(false);
      }
      if (saleId) {
        fetchSaleDetails();
      }
    } else {
      // Delay resetting state to prevent flicker during closing animation
      const timer = setTimeout(() => {
        setSale(null);
        setLoading(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, saleId, initialSaleData]);

  const fetchSaleDetails = useCallback(async () => {
    if (!sale) setLoading(true);
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

  const handlePrintAction = useCallback(async (actionType) => {
    if (!sale) return;
    haptics.medium();
    setIsDownloading(true);
    try {
      await receiptService.print(sale, t, actionType, 'A4');
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

  const handleResumeSale = useCallback(() => {
    if (!sale || !sale.items) return;
    
    haptics.medium();
    
    const newCart = sale.items.map((item) => ({
      id: item.product_variant_id || item.product_id,
      variantId: item.product_variant_id,
      productId: item.product_id,
      barcode: item.barcode,
      name: item.product_name,
      productName: item.product_name,
      variantName: item.variant_name,
      size: item.variant_name,
      unit: item.unit || 'pc',
      quantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.unit_price) || 0,
      discount: parseFloat(item.discount_amount || 0),
    }));

    useCartStore.setState({
      cart: newCart,
      discount: 0,
      adjustment: parseFloat(sale.adjustment || 0)
    });

    onClose();
    setTimeout(() => {
      router.push('/pos');
    }, 150);
  }, [sale, router, onClose]);

  const isHoldSale = sale?.status === 'draft' || sale?.status === 'hold';
  const entityName = sale?.customer?.name || sale?.distributor?.name;
  const entityType = sale?.distributor ? 'Distributor' : 'Customer';

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(c) => !c && onClose()}
      shouldScaleBackground={false} // Disable scaling for performance if requested
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] h-auto max-h-[90dvh] fixed bottom-0 left-0 right-0 z-[501] outline-none shadow-2xl overflow-hidden">
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-glass-border/30 bg-surface">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand/5 text-brand rounded-xl flex items-center justify-center font-black text-lg">
                  #
                </div>
                <div>
                  <Drawer.Title className="text-base font-bold text-text-main leading-none mb-1">Sale Invoice</Drawer.Title>
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

            <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-muted/30">
              {loading && !sale ? (
                <div className="p-8 flex flex-col gap-6 animate-pulse">
                  <div className="h-[300px] w-full bg-surface-muted rounded-2xl shadow-sm" />
                </div>
              ) : error && !sale ? (
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
                        <h4 className="text-sm font-semibold text-orange-700 mb-1">Return Information</h4>
                        <p className="text-xs font-medium text-orange-600/80 leading-relaxed">
                          This transaction has associated returns.
                          {(() => {
                            const total = parseFloat(sale.refunded_amount || sale.returned_amount || sale.total_refund || 0) || 
                              (sale.returns || sale.sale_returns || []).reduce((sum, r) => sum + parseFloat(r.refund_amount || r.total_amount || r.amount || r.total || (r.return_quantity * r.unit_price) || 0), 0);
                            return total > 0 ? (
                              <span className="ml-1">
                                Total refunded:
                                <span className="text-orange-700 font-semibold ml-1">
                                  {formatCurrency(total)}
                                </span>
                              </span>
                            ) : null;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  {isHoldSale ? (
                    <div className="flex flex-col gap-4 mt-2">
                      {entityName && (
                        <div className="bg-surface-muted rounded-2xl p-4 flex flex-col gap-1 border border-glass-border/30">
                          <div className="flex items-center gap-2 text-text-secondary mb-1">
                            <User size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{entityType}</span>
                          </div>
                          <p className="text-sm font-bold text-text-main">{entityName}</p>
                        </div>
                      )}
                      
                      <div className="bg-surface-muted rounded-2xl border border-glass-border/30 overflow-hidden">
                        <div className="bg-black/5 px-4 py-3 border-b border-glass-border/30 flex items-center gap-2">
                          <Package size={16} className="text-brand" />
                          <h4 className="text-sm font-bold text-text-main">Order Items</h4>
                        </div>
                        <div className="flex flex-col">
                          {(sale.items || []).map((item, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between border-b border-glass-border/10 last:border-0">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-text-main">{item.product_name || 'Item'}</span>
                                {item.variant_name && item.variant_name !== 'Default' && (
                                  <span className="text-[11px] text-text-secondary">{item.variant_name}</span>
                                )}
                                <span className="text-xs text-brand font-medium mt-1">{item.quantity} x {formatCurrency(item.unit_price)}</span>
                              </div>
                              <span className="text-sm font-black text-text-main">{formatCurrency(item.total_amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-black/5 p-4 flex items-center justify-between border-t border-glass-border/30">
                          <span className="text-sm font-bold text-text-secondary">Total Amount</span>
                          <span className="text-base font-black text-brand">{formatCurrency(sale.total_amount || sale.payable_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 rounded-[2rem] py-10 px-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden mt-2">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/10 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                      
                      <div className="relative h-20 w-20 rounded-full bg-surface shadow-xl shadow-brand/10 flex items-center justify-center mb-5">
                        <div className="absolute inset-0 rounded-full border-2 border-brand/20 animate-pulse"></div>
                        <PrinterCheck size={32} className="text-brand" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-semibold text-text-main mb-2 tracking-tight">Transaction Complete</h3>
                      <p className="text-xs font-medium text-text-secondary max-w-[250px] leading-relaxed">
                        The sale has been successfully recorded. Tap below to print the receipt.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar - Modern Vertical Stack */}
            {(sale || (!loading && !error)) && (
              <div className="p-6 bg-surface/80 backdrop-blur-xl border-t border-glass-border/30 flex flex-col gap-3 pb-[calc(var(--sab)+2rem)]">
                {isHoldSale ? (
                  <>
                    <button
                      onClick={handleResumeSale}
                      className="w-full h-14 bg-brand text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="text-sm font-bold tracking-wide relative z-10">Continue Sale</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full h-14 bg-surface-muted text-text-main rounded-2xl flex items-center justify-center gap-2 border border-glass-border shadow-sm hover:bg-black/5 active:scale-95 transition-all duration-300"
                    >
                      <span className="text-sm font-bold tracking-wide">Done</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      {/* Share A4 */}
                      <button
                        onClick={() => handlePrintAction('share')}
                        disabled={isDownloading || isPrinting}
                        className="flex-1 h-14 bg-surface-muted text-text-main border border-glass-border/80 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 group"
                      >
                        {isDownloading ? (
                          <div className="h-5 w-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Share2 size={18} className="text-text-secondary group-hover:text-brand transition-colors" />
                            <span className="text-sm font-bold tracking-wide">Share A4</span>
                          </>
                        )}
                      </button>

                      {/* Download A4 */}
                      <button
                        onClick={() => handlePrintAction('download')}
                        disabled={isDownloading || isPrinting}
                        className="flex-1 h-14 bg-surface-muted text-text-main border border-glass-border/80 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 group"
                      >
                        {isDownloading ? (
                          <div className="h-5 w-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Download size={18} className="text-text-secondary group-hover:text-brand transition-colors" />
                            <span className="text-sm font-bold tracking-wide">Save A4</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {/* Thermal Print */}
                      <button
                        onClick={handleNativePrint}
                        disabled={isDownloading || isPrinting}
                        className="flex-1 h-14 bg-brand text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:active:scale-100 overflow-hidden relative"
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
                  </>
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
