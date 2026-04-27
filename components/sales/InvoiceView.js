"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';

export const InvoiceView = ({ sale, terminalName = "MOBILE-POS" }) => {
  const { showLogo, businessLogo, businessName, taxId, headerText, footerText, refundPolicy, businessPhone } = useSettingsStore();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (!sale) return null;

  const qrData = JSON.stringify({
    invoice: sale.invoice_number || "Draft",
    date: sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    total: (sale.payable_amount || sale.net_total || 0).toString()
  });

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
          <p>{sale.branch?.address || "Main Distribution Hub"}</p>
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
                  <div className="font-bold text-xs">
                    {Number(item.quantity || 0)} @ {item.product_name || 
                     item.product?.name || 
                     item.product_variant?.product?.name || 
                     item.variant?.product?.name || 
                     item.name || 
                     t("pos.item")}
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
