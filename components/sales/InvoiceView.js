"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const InvoiceView = ({ sale, business, terminalName = "MOBILE-POS" }) => {
  if (!sale) return null;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (e) {
      return dateStr;
    }
  };

  const qrData = JSON.stringify({
    invoice: sale.invoice_number || "Draft",
    date: sale.created_at ? sale.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    total: (sale.payable_amount || 0).toString()
  });

  return (
    <div className="bg-white text-black p-6 font-mono text-[12px] leading-tight shadow-inner min-h-[500px]">
      {/* Header */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black uppercase tracking-tight">
          {business?.name || sale.branch?.organization?.name || "Inzeedo POS"}
        </h1>
        <div className="opacity-80 text-[10px]">
          <p>{sale.branch?.address || "Main Distribution Hub"}</p>
          <p>Tel: {sale.branch?.phone || "+94 112 345 678"}</p>
          {business?.tax_id && <p>VAT: {business.tax_id}</p>}
        </div>
      </div>

      {/* Stats / Info */}
      <div className="border-y border-dashed border-black/30 py-3 my-4 space-y-1">
        <div className="flex justify-between">
          <span className="font-bold">INVOICE:</span>
          <span className="font-black">{sale.invoice_number}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{formatDate(sale.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>CUSTOMER:</span>
          <span className="font-bold">{sale.customer?.name || "Walk-in Guest"}</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span>{sale.cashier?.name || "System Admin"}</span>
        </div>
        <div className="flex justify-between opacity-60 text-[10px] pt-1">
          <span>TERMINAL:</span>
          <span>{terminalName}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full my-6 border-collapse">
        <thead>
          <tr className="border-b border-black text-left text-[10px]">
            <th className="py-2 pb-1 font-black">ITEM & PRICE</th>
            <th className="py-2 pb-1 text-right font-black">QTY</th>
            <th className="py-2 pb-1 text-right font-black">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-black/10">
          {sale.items?.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="py-3 pr-2">
                <div className="font-black text-[12px] leading-tight mb-0.5">
                  {item.product?.name || item.name}
                </div>
                <div className="text-[10px] opacity-70">
                  {item.variant?.name || "Standard"} @ {Math.round(item.unit_price).toLocaleString()}
                </div>
              </td>
              <td className="text-right py-3 font-bold">{item.quantity}</td>
              <td className="text-right py-3 font-black">
                {Math.round(item.total_amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="border-t border-black pt-4 space-y-1.5">
        <div className="flex justify-between">
          <span className="font-bold">SUB TOTAL:</span>
          <span>LKR {Math.round(sale.total_amount).toLocaleString()}</span>
        </div>
        
        {sale.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-700 italic">
            <span>SAVINGS (DISCOUNT):</span>
            <span>- LKR {Math.round(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}
        
        {sale.tax_amount > 0 && (
          <div className="flex justify-between">
            <span>TAX:</span>
            <span>LKR {Math.round(sale.tax_amount).toLocaleString()}</span>
          </div>
        )}

        {sale.adjustment !== 0 && (
          <div className="flex justify-between">
            <span>ADJUSTMENT:</span>
            <span>{sale.adjustment > 0 ? '+' : '-'} LKR {Math.round(Math.abs(sale.adjustment)).toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-black border-t-2 border-black pt-2 mt-2">
          <span>GRAND TOTAL:</span>
          <span>LKR {Math.round(sale.payable_amount).toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-6 border-t border-dashed border-black/30 pt-4 space-y-1">
        <div className="flex justify-between font-bold">
          <span className="uppercase">{sale.payment_method || "CASH"} PAID:</span>
          <span>LKR {(parseFloat(sale.paid_amount) || sale.payable_amount).toLocaleString()}</span>
        </div>
        {(parseFloat(sale.paid_amount) > sale.payable_amount) && (
          <div className="flex justify-between font-black text-emerald-700">
            <span>CHANGE DUE:</span>
            <span>LKR {(parseFloat(sale.paid_amount) - sale.payable_amount).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* QR Verification */}
      <div className="mt-8 flex flex-col items-center justify-center gap-2">
        <div className="bg-white p-2 border border-black/5 rounded-sm">
          <QRCodeSVG value={qrData} size={90} level="L" />
        </div>
        <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">
          Scan for digital verification
        </p>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center space-y-4 border-t border-dashed border-black/20 pt-6">
        <div className="text-[10px] leading-tight font-bold italic opacity-70">
          "Thank you for your business! Please keep this invoice for any return or exchange."
        </div>
        <div className="opacity-40 leading-none">
          <p className="font-black text-[9px]">A Premium Enterprise Solution by INZEEDO</p>
          <p className="text-[8px] mt-1">© 2026. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};
