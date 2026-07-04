"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';

export const InvoiceView = ({ sale, terminalName = "MOBILE-POS" }) => {
  const { showLogo, businessLogo, businessName, businessAddress, businessEmail, taxId, headerText, footerText, refundPolicy, businessPhone } = useSettingsStore();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (!sale) return null;

  const qrData = JSON.stringify({
    invoice: sale.invoice_number || "Draft",
    date: sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    total: (sale.payable_amount || sale.net_total || 0).toString()
  });

  const { user } = useAuthStore();
  const isManufacturing = (user?.organization?.business_type || "").toLowerCase() === 'manufacturing' || (user?.organization?.business_type || "").toLowerCase() === 'manufacturer';

  if (isManufacturing) {
    return (
      <div className="bg-white text-slate-800 p-6 md:p-8 font-sans text-xs leading-relaxed min-h-[500px] w-full max-w-[800px] mx-auto overflow-x-auto">
        {/* A4 Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6">
          <div className="text-left">
            {showLogo && businessLogo && (
              <img src={businessLogo} alt="Logo" className="h-12 object-contain mb-4" />
            )}
            <h1 className="text-xl font-black text-slate-900 m-0">{businessName || 'Inzeedo Manufacturing'}</h1>
            <p className="mt-2 m-0 text-slate-600">{sale.branch?.address || businessAddress || ''}</p>
            {(sale.branch?.phone || user?.organization?.phone || businessPhone) && (
              <div className="mt-1 flex items-center gap-1.5 text-slate-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{sale.branch?.phone || user?.organization?.phone || businessPhone}</span>
              </div>
            )}
            {(sale.branch?.email || user?.organization?.email || businessEmail) && (
              <div className="mt-0.5 flex items-center gap-1.5 text-slate-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>{sale.branch?.email || user?.organization?.email || businessEmail}</span>
              </div>
            )}
            {taxId && (
              <div className="mt-0.5 flex items-center gap-1.5 text-slate-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>VAT/TIN: {taxId}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-tight m-0">Tax Invoice</h2>
            <p className="mt-4 m-0 text-slate-900"><strong>INV NO:</strong> {sale.invoice_number || 'DRAFT'}</p>
            <p className="m-0 text-slate-600"><strong>DATE:</strong> {sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}</p>
          </div>
        </div>

        {/* Distributor details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Billed To Distributor:</h3>
          {sale.customer ? (
            <>
              <p className="text-base font-black text-slate-900 m-0">{sale.customer.name}</p>
              {sale.customer.phone && <p className="mt-2 m-0 text-slate-600">📞 {sale.customer.phone}</p>}
              {sale.customer.email && <p className="m-0 text-slate-600">✉️ {sale.customer.email}</p>}
              {sale.customer.address && <p className="m-0 text-slate-600">📍 {sale.customer.address}</p>}
            </>
          ) : (
            <p className="m-0 font-bold text-slate-500">Walk-in / No Distributor Selected</p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-8 border border-slate-100 rounded-xl">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="p-3 text-slate-500 font-bold uppercase text-[10px]">#</th>
                <th className="p-3 text-slate-500 font-bold uppercase text-[10px] w-1/2">Item Description</th>
                <th className="p-3 text-slate-500 font-bold uppercase text-[10px] text-center">Qty</th>
                <th className="p-3 text-slate-500 font-bold uppercase text-[10px] text-right">Unit Price</th>
                <th className="p-3 text-slate-500 font-bold uppercase text-[10px] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sale.items || sale.sale_items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-500 font-bold">{idx + 1}</td>
                  <td className="p-3">
                    <strong className="text-slate-900 text-sm">
                      {item.product_name || item.product?.name || item.name || 'Item'}
                    </strong>
                    {(item.variant?.name || item.product_variant?.name || item.variant_name) && (
                      <div className="text-slate-500 mt-1 text-[10px]">Variant: {item.variant?.name || item.product_variant?.name || item.variant_name}</div>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900">{Number(item.quantity)}</td>
                  <td className="p-3 text-right text-slate-600">{parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-right font-black text-slate-900">{parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer/Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="w-full sm:w-1/3 text-center sm:text-left">
            <div className="inline-block p-2 border border-slate-200 rounded-xl bg-white mb-2">
              <QRCodeSVG value={qrData} size={100} level="L" />
            </div>
            <p className="text-[9px] text-slate-400 font-medium max-w-[150px] sm:mx-0 mx-auto text-center">Scan to verify digital invoice authenticity</p>
          </div>

          <div className="w-full sm:w-2/3 max-w-sm bg-white border border-slate-200 rounded-xl p-5 shadow-sm ml-auto">
            <div className="flex justify-between mb-3 text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{parseFloat(sale.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between mb-3 text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">- {parseFloat(sale.discount_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
            {parseFloat(sale.tax_amount || 0) > 0 && (
              <div className="flex justify-between mb-3 text-slate-600">
                <span>VAT / Tax</span>
                <span className="font-bold text-slate-900">{parseFloat(sale.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
            {parseFloat(sale.adjustment || 0) !== 0 && (
              <div className="flex justify-between mb-3 text-indigo-600">
                <span>Adjustment</span>
                <span className="font-bold">{parseFloat(sale.adjustment).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-black text-slate-900 border-t-2 border-dashed border-slate-300 pt-4 mt-3">
              <span>Total Payable</span>
              <span>{parseFloat(sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <div className="mt-6 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Amount Paid ({sale.payments?.[0]?.payment_method?.toUpperCase() || sale.payment_method || 'CASH'})</span>
                <span className="text-slate-900">{parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              {parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) && (
                <div className="flex justify-between text-xs font-black text-emerald-600">
                  <span>Change Due</span>
                  <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-slate-500">
          {refundPolicy && <p className="mb-3"><strong>Terms & Conditions:</strong><br/>{refundPolicy}</p>}
          {footerText ? <p className="mb-3">{footerText}</p> : <p className="mb-3 font-bold text-slate-600">Thank you for your business!</p>}
          <p className="font-bold text-slate-400">Generated by Inzeedo Manufacturing ERP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-6 font-mono text-[11px] leading-tight shadow-inner min-h-[500px] w-full max-w-[400px] mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        {showLogo && businessLogo && (
          <div className="flex justify-center mb-2">
            <img src={businessLogo} alt="Business Logo" className="w-16 h-16 object-contain" />
          </div>
        )}
        <h1 className="text-lg font-black uppercase tracking-tight">
          {businessName || "Inzeedo POS"}
        </h1>
        <div className="opacity-80 leading-tight">
          <p>{sale.branch?.address || businessAddress || "Main Distribution Hub"}</p>
          <p>{t('pos.tel')}: {sale.branch?.phone || businessPhone || "+94 112 345 678"}</p>
          {taxId && <p>{t('pos.vat')}: {taxId}</p>}
        </div>
        {headerText && headerText !== "Sale Invoice" && (
          <p className="mt-2 font-bold border-t border-black pt-1">{headerText}</p>
        )}
      </div>

      <div className="border-y border-dashed border-black py-2 my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>{t('pos.invoice')}:</span>
          <span className="font-bold">{sale.invoice_number || "Draft"}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('pos.date')}:</span>
          <span>{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd HH:mm") : format(new Date(), "yyyy-MM-dd HH:mm")}</span>
        </div>
        <div className="text-center font-bold text-[10px] my-1 border-b border-dashed border-black/30 pb-0.5">
          {(sale.is_wholesale ? t('pos.wholesale') : t('pos.retail')).toUpperCase()} SALE
        </div>
        {sale.customer && (
          <div className="flex justify-between">
            <span>{t('pos.customer')}:</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t('pos.user')}:</span>
          <span>{sale.cashier?.name || "System Admin"}</span>
        </div>
        {terminalName && (
          <div className="flex justify-between border-t border-dashed border-black/10 mt-1 pt-0.5 text-[9px] opacity-60">
            <span>{t('pos.terminal')}:</span>
            <span>{terminalName.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full my-4 border-collapse">
        <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 font-black uppercase text-[10px] w-[50%]">{t('pos.item_qty')}</th>
              <th className="py-1 text-right font-black uppercase text-[10px] w-[25%]">{t('pos.price_col')}</th>
              <th className="py-1 text-right font-black uppercase text-[10px] w-[25%]">{t('pos.amount_col')}</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-black/20">
          {(sale.items || sale.sale_items || []).map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-2 pr-2" style={{ width: '50%', minWidth: '50%' }}>
                <div className="leading-tight flex flex-col">
                  <div className="font-bold text-xs flex items-center flex-wrap gap-1.5">
                    <span>{Number(item.quantity || 0)} @ {item.product_name || 
                     item.product?.name || 
                     item.product_variant?.product?.name || 
                     item.variant?.product?.name || 
                     item.name || 
                    t("pos.item")}</span>
                    {(item.returned_quantity > 0 || item.quantity_returned > 0 || item.return_qty > 0) && (
                      <span className="bg-orange-100 text-orange-600 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                        Returned {item.returned_quantity || item.quantity_returned || item.return_qty}
                      </span>
                    )}
                  </div>
                </div>
                {(item.variant?.name || item.product_variant?.name || item.variant_name || item.product_variant_name) && (
                  <div className="text-[10px] opacity-60 italic font-medium mt-0.5 pl-3 flex items-start gap-1">
                    <span>-</span>
                    <span>{item.variant?.name || item.product_variant?.name || item.variant_name || item.product_variant_name}</span>
                  </div>
                )}
              </td>
              <td className="text-right py-2 whitespace-nowrap" style={{ width: '25%' }}>
                {parseFloat(item.unit_price || item.price || 0).toLocaleString()}
              </td>
              <td className="text-right py-2 font-bold whitespace-nowrap" style={{ width: '25%' }}>
                {parseFloat((item.unit_price || item.price || 0) * (item.quantity || 0)).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>{t('checkout.subtotal')}:</span>
          <span>{parseFloat(sale.total_amount).toLocaleString()}</span>
        </div>

        {sale.discount_amount > 0 && (
          <div className="flex justify-between text-[10px] text-green-700 border-b border-dashed border-black/20 pb-1 mb-1 italic">
            <span>{t('checkout.discount')}:</span>
            <span>- {parseFloat(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}

        {parseFloat(sale.tax_amount || 0) > 0 && (
          <div className="flex justify-between">
            <span>{t('checkout.vat') || 'TAX'}:</span>
            <span>{parseFloat(sale.tax_amount).toLocaleString()}</span>
          </div>
        )}

        {parseFloat(sale.adjustment || 0) !== 0 && (
          <div className="flex justify-between">
            <span>{t('checkout.adjustment')}:</span>
            <span>{parseFloat(sale.adjustment).toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-[14px] font-black border-t-2 border-black pt-1 mt-1 uppercase">
          <span>{t('pos.total')}:</span>
          <span>{parseFloat(sale.payable_amount).toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-4 border-t border-dashed border-black pt-2 space-y-1">
        {sale.payments && sale.payments.length > 0 ? (
          sale.payments.map((pmt, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="uppercase">{pmt.payment_method} PAID:</span>
              <span className="font-bold">{parseFloat(pmt.amount).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-[11px]">
            <span className="uppercase">{sale.payment_method || "CASH"} PAID:</span>
            <span className="font-bold">{parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span>
          </div>
        )}

        {parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) && (
          <div className="flex justify-between font-bold border-t border-black/10 mt-1 pt-1">
            <span>{t('pos.change')}:</span>
            <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* QR Verification */}
      <div className="mt-4 flex flex-col items-center justify-center space-y-1">
        <QRCodeSVG value={qrData} size={80} level="L" />
        <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest">
          {t('pos.scanForVerification')}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center space-y-2 border-t border-dashed border-black/20 pt-2">
        {refundPolicy && (
          <div className="border-b border-dashed border-black/10 pb-2 mb-2 text-[9px] leading-tight">
            <span className="font-bold block mb-1 uppercase">{t('pos.policy')}:</span>
            {refundPolicy}
          </div>
        )}

        {footerText && (
          <div className="whitespace-pre-wrap leading-tight text-[10px] mb-2">{footerText}</div>
        )}
        <div className="opacity-40 leading-tight">
          <p className="font-bold text-[8px] whitespace-nowrap">A next-generation enterprise solution by Inzeedo</p>
          <p className="text-[7px]">© 2026 Inzeedo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
