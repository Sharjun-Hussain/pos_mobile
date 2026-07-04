"use client";

import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Receipt Service
 * Handles formatting and printing of professional thermal receipts.
 * Designed to match the Web POS high-fidelity output.
 */

export const receiptService = {
  /**
   * Generates a thermal receipt layout and triggers the print dialog.
   */
  print: async (sale, t) => {
    if (!sale) return;

    // Use provided translation function or fallback to a simple mapper
    const translate = t || ((key) => {
      const parts = key.split('.');
      const label = parts[parts.length - 1];
      return label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ');
    });

    const {
      showLogo,
      businessLogo,
      businessName,
      taxId,
      headerText,
      footerText,
      refundPolicy,
      paperWidth,
      terminalName,
      businessPhone
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

    const user = useAuthStore.getState().user;
    const isManufacturing = user?.organization?.business_type === 'Manufacturing' || user?.organization?.business_type === 'manufacturer';

    let receiptHtml = '';

    if (isManufacturing) {
      receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${sale.invoice_number}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; font-size: 14px; width: 100%; color: #333; line-height: 1.5; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .company-details { text-align: left; }
          .invoice-details { text-align: right; }
          .distributor-details { margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
          table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
          th { background: #f8fafc; padding: 14px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; border-top: 1px solid #e2e8f0; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 12px; }
          th:first-child { border-left: 1px solid #e2e8f0; border-top-left-radius: 8px; }
          th:last-child { border-right: 1px solid #e2e8f0; border-top-right-radius: 8px; }
          td { padding: 16px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          td:first-child { border-left: 1px solid #e2e8f0; }
          td:last-child { border-right: 1px solid #e2e8f0; }
          tr:last-child td:first-child { border-bottom-left-radius: 8px; }
          tr:last-child td:last-child { border-bottom-right-radius: 8px; }
          
          .totals-wrapper { display: flex; justify-content: space-between; align-items: flex-start; }
          .totals { width: 350px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .totals .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #475569; }
          .totals .row.grand-total { font-size: 22px; font-weight: 900; color: #0f172a; border-top: 2px dashed #cbd5e1; padding-top: 16px; margin-top: 12px; margin-bottom: 0; }
          .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-details">
            ${showLogo && businessLogo ? `<img src="${businessLogo}" style="height: 60px; margin-bottom: 15px; object-fit: contain;" />` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a;">${businessName || 'Inzeedo Manufacturing'}</h1>
            <p style="margin: 8px 0 0 0; color: #475569;">${sale.branch?.address || ''}</p>
            <p style="margin: 4px 0 0 0; color: #475569;">TEL: ${sale.branch?.phone || businessPhone || '+94 112 345 678'}</p>
            ${taxId ? `<p style="margin: 4px 0 0 0; color: #475569;">VAT/TIN: ${taxId}</p>` : ''}
          </div>
          <div class="invoice-details">
            <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #4338ca; letter-spacing: -1px; text-transform: uppercase;">Tax Invoice</h2>
            <p style="font-size: 16px; margin: 15px 0 5px 0; color: #0f172a;"><strong>INV NO:</strong> ${sale.invoice_number || 'DRAFT'}</p>
            <p style="margin: 0; color: #475569;"><strong>DATE:</strong> ${formatDate(sale.created_at)}</p>
          </div>
        </div>

        <div class="distributor-details">
          <h3 style="margin: 0 0 12px 0; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Billed To Distributor:</h3>
          ${sale.customer ? `
            <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a;">${sale.customer.name}</p>
            ${sale.customer.phone ? `<p style="margin: 6px 0 0 0; color: #475569;">📞 ${sale.customer.phone}</p>` : ''}
            ${sale.customer.email ? `<p style="margin: 4px 0 0 0; color: #475569;">✉️ ${sale.customer.email}</p>` : ''}
            ${sale.customer.address ? `<p style="margin: 4px 0 0 0; color: #475569;">📍 ${sale.customer.address}</p>` : ''}
          ` : '<p style="margin: 0; font-weight: bold; color: #64748b;">Walk-in / No Distributor Selected</p>'}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Item Description</th>
              <th style="width: 15%; text-align: center;">Quantity</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              <th style="width: 20%; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || sale.sale_items || []).map((item, idx) => `
              <tr>
                <td style="color: #64748b; font-weight: bold;">${idx + 1}</td>
                <td>
                  <strong style="color: #0f172a; font-size: 15px;">${item.product_name || item.product?.name || item.name || 'Item'}</strong>
                  ${(item.variant?.name || item.product_variant?.name || item.variant_name) ? `<br/><span style="color: #64748b; font-size: 13px; display: inline-block; margin-top: 4px;">Variant: ${item.variant?.name || item.product_variant?.name || item.variant_name}</span>` : ''}
                </td>
                <td style="text-align: center; font-weight: 600; color: #0f172a;">${Number(item.quantity)}</td>
                <td style="text-align: right; color: #475569;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-wrapper">
          <div style="width: 200px;">
            <img src="${qrUrl}" style="width: 130px; height: 130px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px; background: #fff;" />
            <p style="font-size: 11px; color: #94a3b8; margin-top: 10px; text-align: center; width: 150px; font-weight: 500;">Scan to verify digital invoice authenticity</p>
          </div>
          
          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span style="font-weight: 600; color: #0f172a;">${parseFloat(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            ${parseFloat(sale.discount_amount) > 0 ? `
              <div class="row" style="color: #059669;">
                <span>Discount</span>
                <span style="font-weight: 600;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            ${parseFloat(sale.tax_amount) > 0 ? `
              <div class="row">
                <span>VAT / Tax</span>
                <span style="font-weight: 600; color: #0f172a;">${parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            ${parseFloat(sale.adjustment || 0) !== 0 ? `
              <div class="row" style="color: #4338ca;">
                <span>Adjustment</span>
                <span style="font-weight: 600;">${parseFloat(sale.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            
            <div class="row grand-total">
              <span>Total Payable</span>
              <span>${parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div style="margin-top: 24px; background: #f8fafc; padding: 16px; border-radius: 8px;">
              <div class="row" style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span>Amount Paid (${sale.payments?.[0]?.payment_method?.toUpperCase() || sale.payment_method || 'CASH'})</span>
                <span style="color: #0f172a;">${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              ${parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) ? `
                <div class="row" style="font-size: 13px; font-weight: 800; color: #059669; margin-bottom: 0;">
                  <span>Change Due</span>
                  <span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="footer">
          ${refundPolicy ? `<p style="margin-bottom: 12px; color: #475569;"><strong>Terms & Conditions:</strong><br/>${refundPolicy}</p>` : ''}
          ${footerText ? `<p style="margin-bottom: 12px; color: #475569;">${footerText}</p>` : '<p style="margin-bottom: 12px; color: #475569; font-weight: 600;">Thank you for your business!</p>'}
          <p style="margin: 0; font-weight: bold; color: #94a3b8;">Generated by Inzeedo Manufacturing ERP</p>
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
    } else {
      receiptHtml = `
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
            padding-top: 4px;
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
            <div>TEL: ${sale.branch?.phone || businessPhone || '+94 112 345 678'}</div>
            ${taxId ? `<div>VAT/TIN: ${taxId}</div>` : ''}
          </div>
          ${headerText && headerText !== 'Sale Invoice' ? `
            <div class="bold" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px;">${headerText}</div>
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
            <tr class="header">
              <th style="width: 50%;">${translate('pos.item_qty')}</th>
              <th class="right" style="width: 25%;">${translate('pos.price_col')}</th>
              <th class="right" style="width: 25%;">${translate('pos.amount_col')}</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || sale.sale_items || []).map(item => `
              <tr>
                <td style="width: 50%; min-width: 50%;">
                  <div class="item-row">
                    <span class="item-name">${Number(item.quantity)} @ ${item.product_name ||
        item.product?.name ||
        item.product_variant?.product?.name ||
        item.variant?.product?.name ||
        item.name ||
        'Item'
        }</span>
                  </div>
                  ${(item.variant?.name || item.product_variant?.name || item.variant_name || item.product_variant_name) ? `
                    <div class="item-variant" style="padding-left: 12px; font-size: 9px;">- ${item.variant?.name || item.product_variant?.name || item.variant_name || item.product_variant_name}</div>
                  ` : ''}
                </td>
                <td class="right" style="width: 25%;">${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
                <td class="right bold" style="width: 25%;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 4px;">
          <div class="row">
            <span>${translate('checkout.subtotal')}:</span>
            <span>${parseFloat(sale.total_amount).toLocaleString()}</span>
          </div>
          ${parseFloat(sale.discount_amount) > 0 ? `
            <div class="row" style="color: #15803d; font-size: 10px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 2px; margin-bottom: 2px;">
              <span>${translate('checkout.discount')}:</span>
              <span>- ${parseFloat(sale.discount_amount).toLocaleString()}</span>
            </div>
          ` : ''}
          ${parseFloat(sale.tax_amount) > 0 ? `
            <div class="row">
              <span>${translate('checkout.vat')}:</span>
              <span>${parseFloat(sale.tax_amount).toLocaleString()}</span>
            </div>
          ` : ''}
          ${parseFloat(sale.adjustment || 0) !== 0 ? `
            <div class="row">
              <span>${translate('checkout.adjustment')}:</span>
              <span>${parseFloat(sale.adjustment).toLocaleString()}</span>
            </div>
          ` : ''}
          
          <div class="row grand-total">
            <span>${translate('pos.total')}:</span>
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
    }

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  }
};

