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
      <div className="bg-white text-black p-6 md:p-8 font-sans text-xs leading-relaxed min-h-[500px] w-full max-w-[800px] mx-auto overflow-x-auto">
        {/* A4 Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
          <div className="text-left">
            {showLogo && businessLogo && (
              <img src={businessLogo} alt="Logo" className="h-12 object-contain mb-4 grayscale" />
            )}
            <h1 className="text-2xl font-black text-black m-0 tracking-tight">{businessName || 'Inzeedo Manufacturing'}</h1>
            {(sale.branch?.address || businessAddress) && (
              <div className="mt-2 flex items-start gap-1.5 text-gray-800 font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>{sale.branch?.address || businessAddress}</span>
              </div>
            )}
            {(sale.branch?.phone || user?.organization?.phone || businessPhone) && (
              <div className="mt-1 flex items-center gap-1.5 text-gray-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{sale.branch?.phone || user?.organization?.phone || businessPhone}</span>
              </div>
            )}
            {(sale.branch?.email || user?.organization?.email || businessEmail) && (
              <div className="mt-0.5 flex items-center gap-1.5 text-gray-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>{sale.branch?.email || user?.organization?.email || businessEmail}</span>
              </div>
            )}
            {taxId && (
              <div className="mt-0.5 flex items-center gap-1.5 text-gray-700 font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>VAT/TIN: {taxId}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-black tracking-tighter m-0 uppercase border-b-2 border-black inline-block pb-1">Tax Invoice</h2>
            <div className="mt-4 flex flex-col gap-1 text-right items-end">
              <div className="flex gap-2 justify-end w-full">
                <span className="text-gray-500 font-normal w-20">INV NO:</span>
                <span className="text-black font-normal">{sale.invoice_number || 'DRAFT'}</span>
              </div>
              <div className="flex gap-2 justify-end w-full">
                <span className="text-gray-500 font-normal w-20">DATE:</span>
                <span className="text-black font-normal">{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distributor details */}
        <div className="border-2 border-black p-5 mb-8">
          <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3 border-b border-black pb-2 inline-block">Billed To</h3>
          {sale.customer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-black text-black m-0">{sale.customer.name}</p>
                {sale.customer.address && <p className="mt-2 m-0 text-gray-800 font-medium max-w-xs">{sale.customer.address}</p>}
              </div>
              <div className="text-left md:text-right flex flex-col justify-end">
                {sale.customer.phone && <p className="m-0 text-black font-bold">P: {sale.customer.phone}</p>}
                {sale.customer.email && <p className="m-0 text-black font-bold mt-1">E: {sale.customer.email}</p>}
              </div>
            </div>
          ) : (
            <p className="m-0 font-bold text-gray-500">Walk-in / No Distributor Selected</p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-8 border-t-2 border-b-2 border-black">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="p-3 text-black font-black text-[10px] uppercase">#</th>
                <th className="p-3 text-black font-black text-[10px] uppercase w-1/2">Item Description</th>
                <th className="p-3 text-black font-black text-[10px] uppercase text-center">Qty</th>
                <th className="p-3 text-black font-black text-[10px] uppercase text-right">Unit Price</th>
                <th className="p-3 text-black font-black text-[10px] uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {(sale.items || sale.sale_items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-3 text-black font-normal">{idx + 1}</td>
                  <td className="p-3">
                    <span className="text-black text-sm font-normal">
                      {item.product_name || item.product?.name || item.name || 'Item'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-normal text-black">{Number(item.quantity)}</td>
                  <td className="p-3 text-right text-black font-normal">{parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-right font-normal text-black">{parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer/Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="w-full sm:w-1/3 text-center sm:text-left">
            <div className="inline-block p-2 border-2 border-black bg-white mb-2">
              <QRCodeSVG value={qrData} size={100} level="L" fgColor="#000000" />
            </div>
            <p className="text-[10px] text-black font-bold max-w-[150px] sm:mx-0 mx-auto text-center uppercase tracking-wider">Scan to Verify Authenticity</p>
          </div>

          <div className="w-full sm:w-2/3 max-w-sm ml-auto">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-black">
                <span className="font-bold">Subtotal</span>
                <span className="font-bold">{parseFloat(sale.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-black">
                  <span className="font-bold">Discount</span>
                  <span className="font-bold">- {parseFloat(sale.discount_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
              {parseFloat(sale.tax_amount || 0) > 0 && (
                <div className="flex justify-between text-black">
                  <span className="font-bold">VAT / Tax</span>
                  <span className="font-bold">{parseFloat(sale.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
              {parseFloat(sale.adjustment || 0) !== 0 && (
                <div className="flex justify-between text-black">
                  <span className="font-bold">Adjustment</span>
                  <span className="font-bold">{parseFloat(sale.adjustment).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xl font-black text-black border-t-4 border-black pt-4 mt-4 mb-6">
              <span className="uppercase">Total Payable</span>
              <span>{parseFloat(sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs font-black text-black mb-2 uppercase">
                <span>Amount Paid ({sale.payments?.[0]?.payment_method || sale.payment_method || 'CASH'})</span>
                <span>{parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              {parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) && (
                <div className="flex justify-between text-xs font-black text-black uppercase border-t border-dashed border-gray-400 pt-2">
                  <span>Change Due</span>
                  <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-black flex justify-between items-end">
          <div className="text-left text-black max-w-lg">
            {refundPolicy && (
              <div className="mb-4">
                <strong className="text-[10px] border-b border-black pb-1 mb-2 inline-block font-bold">Terms &amp; Conditions</strong>
                <p className="mt-2 text-[10px] font-medium leading-relaxed">{refundPolicy}</p>
              </div>
            )}
            {footerText ? <p className="mb-0 font-medium text-[10px]">{footerText}</p> : <p className="mb-0 font-black uppercase text-lg tracking-tight">Thank you for your business.</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-black border-t border-black pt-2 inline-block">Authorized Signature</p>
          </div>
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
        <h1 className="text-lg font-black tracking-tight">
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
          {(sale.is_wholesale ? t('pos.wholesale') : t('pos.retail'))} SALE
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
            <span>{terminalName}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full my-4 border-collapse">
        <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 font-black text-[10px] w-[50%]">{t('pos.item_qty')}</th>
              <th className="py-1 text-right font-black text-[10px] w-[25%]">{t('pos.price_col')}</th>
              <th className="py-1 text-right font-black text-[10px] w-[25%]">{t('pos.amount_col')}</th>
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
                      <span className="bg-orange-100 text-orange-600 px-1 py-0.5 rounded text-[8px] font-black tracking-tighter">
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

        <div className="flex justify-between text-[14px] font-black border-t-2 border-black pt-1 mt-1">
          <span>{t('pos.total')}:</span>
          <span>{parseFloat(sale.payable_amount).toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-4 border-t border-dashed border-black pt-2 space-y-1">
        {sale.payments && sale.payments.length > 0 ? (
          sale.payments.map((pmt, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="">{pmt.payment_method} PAID:</span>
              <span className="font-bold">{parseFloat(pmt.amount).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-[11px]">
            <span className="">{sale.payment_method || "CASH"} PAID:</span>
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
        <p className="text-[7px] font-bold opacity-40 tracking-widest">
          {t('pos.scanForVerification')}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center space-y-2 border-t border-dashed border-black/20 pt-2">
        {refundPolicy && (
          <div className="border-b border-dashed border-black/10 pb-2 mb-2 text-[9px] leading-tight">
            <span className="font-bold block mb-1">{t('pos.policy')}:</span>
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
