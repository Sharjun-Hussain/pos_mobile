"use client";

import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Receipt Service
 * Handles formatting and printing of professional thermal receipts.
 * Designed to match the Web POS high-fidelity output.
 */

export const receiptService = {
  /**
   * Generates a thermal receipt layout and triggers the print dialog.
   */
  print: async (sale) => {
    if (!sale) return;

    const { 
      showLogo, 
      businessLogo, 
      businessName, 
      taxId, 
      headerText, 
      footerText, 
      refundPolicy,
      paperWidth,
      terminalName 
    } = useSettingsStore.getState();

    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr || new Date());
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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    const width = paperWidth === '58mm' ? '58mm' : '80mm';

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${sale.invoice_number}</title>
        <style>
          @page { size: ${width} auto; margin: 0; }
          body { 
            width: ${width}; 
            margin: 0; 
            padding: 8mm 4mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 11px; 
            line-height: 1.2;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .black { font-weight: 900; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .thick-divider { border-top: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 1px 0; }
          .header { margin-bottom: 12px; }
          .footer { margin-top: 15px; font-size: 9px; opacity: 0.8; }
          
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; font-size: 10px; text-transform: uppercase; }
          td { padding: 6px 0; vertical-align: top; border-bottom: 1px dashed rgba(0,0,0,0.15); }
          
          .item-row { display: block; }
          .item-name { font-weight: bold; font-size: 11px; }
          .item-qty { font-weight: normal; opacity: 0.7; margin-left: 4px; }
          .item-variant { font-size: 9px; opacity: 0.7; display: block; margin-top: 1px; }
          
          .grand-total { 
            font-size: 14px; 
            font-weight: 900; 
            padding-top: 4px; 
            margin-top: 4px;
            border-top: 2px solid #000;
          }
          .qr-container { margin: 15px 0; text-align: center; }
          .qr-image { width: 80px; height: 80px; }
          .sale-type { 
            font-weight: bold; 
            font-size: 10px; 
            margin: 4px 0; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 4px; 
          }
          
          @media print {
            body { padding: 4mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center header">
          ${showLogo && businessLogo ? `
            <img src="${businessLogo}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 8px;" />
          ` : ''}
          <div class="bold" style="font-size: 18px; line-height: 1.1;">${businessName || 'Inzeedo POS'}</div>
          <div style="opacity: 0.8; margin-top: 4px;">
            <div>${sale.branch?.address || ''}</div>
            <div>TEL: ${sale.branch?.phone || ''}</div>
            ${taxId ? `<div>VAT/TIN: ${taxId}</div>` : ''}
          </div>
          ${headerText && headerText !== 'Sale Invoice' ? `
            <div class="bold" style="margin-top: 8px; border-top: 1px solid #000; pt-1">${headerText}</div>
          ` : ''}
        </div>

        <div class="divider" style="border-top-style: dashed;"></div>
        
        <div class="row">
          <span>INVOICE:</span>
          <span class="bold">${sale.invoice_number || 'DRAFT'}</span>
        </div>
        <div class="row">
          <span>DATE:</span>
          <span>${formatDate(sale.created_at)}</span>
        </div>
        
        <div class="center sale-type">
          ${(sale.is_wholesale ? 'WHOLESALE' : 'RETAIL').toUpperCase()} SALE
        </div>

        ${sale.customer ? `
          <div class="row">
            <span>CUSTOMER:</span>
            <span>${sale.customer.name}</span>
          </div>
        ` : ''}
        <div class="row">
          <span>USER:</span>
          <span>${sale.cashier?.name || 'Staff User'}</span>
        </div>
        ${terminalName ? `
          <div class="row" style="opacity: 0.6; font-size: 9px;">
            <span>TERMINAL:</span>
            <span>${terminalName.toUpperCase()}</span>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">ITEM/QTY</th>
              <th class="right" style="width: 25%;">PRICE</th>
              <th class="right" style="width: 25%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || []).map(item => `
              <tr>
                <td>
                  <div class="item-row">
                    <span class="item-name">${item.product?.name || item.name}</span>
                    <span class="item-qty">(x${parseFloat(item.quantity)})</span>
                  </div>
                  ${(item.variant?.name || item.variant_name) ? `<span class="item-variant">${item.variant?.name || item.variant_name}</span>` : ''}
                </td>
                <td class="right">${parseFloat(item.unit_price || item.price).toLocaleString()}</td>
                <td class="right bold">${parseFloat(item.total_amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 4px;">
          <div class="row">
            <span>SUB TOTAL:</span>
            <span>${parseFloat(sale.total_amount).toLocaleString()}</span>
          </div>
          ${parseFloat(sale.discount_amount) > 0 ? `
            <div class="row" style="color: #15803d; font-size: 10px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 2px; margin-bottom: 2px;">
              <span>TOTAL DISCOUNT:</span>
              <span>${parseFloat(sale.discount_amount).toLocaleString()}</span>
            </div>
          ` : ''}
          ${parseFloat(sale.tax_amount) > 0 ? `
            <div class="row">
              <span>TAX:</span>
              <span>${parseFloat(sale.tax_amount).toLocaleString()}</span>
            </div>
          ` : ''}
          ${parseFloat(sale.adjustment || 0) !== 0 ? `
            <div class="row">
              <span>ADJUSTMENT:</span>
              <span>${parseFloat(sale.adjustment).toLocaleString()}</span>
            </div>
          ` : ''}
          
          <div class="row grand-total">
            <span>GRAND TOTAL:</span>
            <span>${parseFloat(sale.payable_amount).toLocaleString()}</span>
          </div>
        </div>

        <div style="margin-top: 8px; border-top: 1px dashed #000; pt-2;">
          ${sale.payments && sale.payments.length > 0 ? sale.payments.map(pmt => `
              <div class="row" style="font-size: 11px;">
                <span class="uppercase">${pmt.payment_method} PAID:</span>
                <span class="bold">${parseFloat(pmt.amount).toLocaleString()}</span>
              </div>
          `).join('') : `
              <div class="row" style="font-size: 11px;">
                <span class="uppercase">${sale.payment_method || 'CASH'} PAID:</span>
                <span class="bold">${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span>
              </div>
          `}
          
          ${(parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount)) ? `
            <div class="row" style="font-weight: bold; border-top: 1px solid rgba(0,0,0,0.1); mt-1; pt-1;">
              <span>CHANGE:</span>
              <span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="Verification QR" />
          <div style="font-size: 7px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.4; font-weight: bold;">Scan for digital verification</div>
        </div>

        <div class="footer center">
          ${refundPolicy ? `
            <div style="border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 8px; font-size: 9px;">
              <span class="bold">REFUND/RETURN POLICY:</span><br/>
              ${refundPolicy}
            </div>
          ` : ''}
          ${footerText ? `<div style="font-size: 10px; margin-bottom: 8px; white-space: pre-wrap;">${footerText}</div>` : ''}
          
          <div style="opacity: 0.5; margin-top: 12px; line-height: 1.1;">
            <div class="bold" style="font-size: 8px;">A next-generation enterprise solution by Inzeedo</div>
            <div style="font-size: 7px;">© 2026 Inzeedo. All rights reserved.</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  }
};

