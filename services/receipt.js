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
      paperWidth 
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
            font-size: 12px; 
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .header { margin-bottom: 12px; }
          .footer { margin-top: 20px; font-size: 10px; opacity: 0.8; }
          
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; font-size: 10px; text-transform: uppercase; }
          td { padding: 4px 0; vertical-align: top; }
          
          .item-name { font-weight: bold; font-size: 12px; display: block; }
          .item-desc { font-size: 10px; opacity: 0.7; }
          
          .total-row { font-size: 15px; font-weight: 900; margin-top: 4px; padding-top: 4px; }
          .qr-container { margin: 15px 0; text-align: center; }
          .qr-image { width: 80px; height: 80px; }
          .sale-badge { 
             text-align: center; 
             font-size: 10px; 
             font-weight: bold; 
             border: 1px solid #000; 
             margin: 5px auto; 
             padding: 2px 8px;
             display: inline-block;
          }
          
          @media print {
            body { padding: 0 4mm 8mm 4mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center header">
          ${showLogo && businessLogo ? `
            <img src="${businessLogo}" style="max-width: 120px; max-height: 60px; object-fit: contain; margin-bottom: 10px;" />
          ` : ''}
          <div class="bold" style="font-size: 16px; line-height: 1.1;">${headerText || businessName || 'INZEEDO POS'}</div>
          ${sale.branch?.name ? `<div style="text-transform: uppercase; font-size: 11px; margin-top: 2px;">${sale.branch.name}</div>` : ''}
          <div style="font-size: 10px;">${sale.branch?.address || ''}</div>
          <div style="font-size: 10px;">TEL: ${sale.branch?.phone || ''}</div>
          ${taxId ? `<div style="font-size: 10px;">TIN: ${taxId}</div>` : ''}
        </div>

        <div class="divider"></div>
        
        <div class="center">
           <div class="sale-badge">${(sale.is_wholesale ? 'WHOLESALE' : 'RETAIL').toUpperCase()} SALE</div>
        </div>

        <div class="row">
          <span>INVOICE:</span>
          <span class="bold">${sale.invoice_number || 'DRAFT'}</span>
        </div>
        <div class="row">
          <span>DATE:</span>
          <span>${formatDate(sale.created_at)}</span>
        </div>
        <div class="row">
          <span>CASHIER:</span>
          <span>${sale.cashier?.name || 'Staff User'}</span>
        </div>
        ${sale.customer ? `
          <div class="row">
            <span>CUSTOMER:</span>
            <span class="bold">${sale.customer.name}</span>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 45%;">ITEM/QTY</th>
              <th class="right" style="width: 25%;">PRICE</th>
              <th class="right" style="width: 30%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || []).map(item => `
              <tr>
                <td colspan="3">
                  <span class="item-name">${item.product?.name || item.name}</span>
                  <span class="item-desc">${item.variant?.name || item.variant_name || 'Standard'}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px dotted #ccc;">
                <td class="bold">x ${parseFloat(item.quantity)}</td>
                <td class="right">${parseFloat(item.unit_price || item.price).toLocaleString()}</td>
                <td class="right bold">${parseFloat(item.total_amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="row">
          <span>SUB TOTAL:</span>
          <span>${parseFloat(sale.total_amount).toLocaleString()}</span>
        </div>
        ${parseFloat(sale.discount_amount) > 0 ? `
          <div class="row">
            <span>SAVINGS (DISC):</span>
            <span>- ${parseFloat(sale.discount_amount).toLocaleString()}</span>
          </div>
        ` : ''}
        ${parseFloat(sale.sscl_amount) > 0 ? `
          <div class="row">
            <span>SSCL:</span>
            <span>${parseFloat(sale.sscl_amount).toLocaleString()}</span>
          </div>
        ` : ''}
        ${parseFloat(sale.vat_amount) > 0 ? `
          <div class="row">
            <span>VAT:</span>
            <span>${parseFloat(sale.vat_amount).toLocaleString()}</span>
          </div>
        ` : (parseFloat(sale.tax_amount) > 0 && !sale.sscl_amount) ? `
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
        
        <div class="double-divider"></div>
        
        <div class="row total-row">
          <span>GRAND TOTAL:</span>
          <span>LKR ${parseFloat(sale.payable_amount).toLocaleString()}</span>
        </div>

        <div class="divider"></div>
        
        ${sale.payments && sale.payments.length > 0 ? sale.payments.map(pmt => `
            <div class="row bold">
              <span class="uppercase">${pmt.payment_method} PAID:</span>
              <span>LKR ${parseFloat(pmt.amount).toLocaleString()}</span>
            </div>
        `).join('') : `
            <div class="row bold">
              <span class="uppercase">${sale.payment_method || 'CASH'} PAID:</span>
              <span>LKR ${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span>
            </div>
        `}
        
        ${(parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount)) ? `
          <div class="row">
            <span>CHANGE:</span>
            <span>LKR ${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
          </div>
        ` : ''}

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="Verification QR" />
          <div style="font-size: 7px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5;">Scan for digital verification</div>
        </div>

        <div class="footer center">
          ${refundPolicy ? `<div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; font-size: 9px; line-height: 1.2;"><b>POLICIES:</b> ${refundPolicy}</div>` : ''}
          <div class="bold italic">"${footerText || 'Thank you for your business!'}"</div>
          <div style="margin-top: 15px;">
            <div class="bold">POWRED BY INZEEDO POS</div>
            <div style="font-size: 8px; opacity: 0.6;">A Premium Enterprise Cloud Solution</div>
          </div>
          <br/>
          <div style="font-size: 9px; border: 1px solid #000; padding: 2px;">*** CUSTOMER COPY ***</div>
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
