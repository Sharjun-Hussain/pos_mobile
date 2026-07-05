"use client";

import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Receipt Service
 * For Manufacturing: opens a full A4 tax invoice in a new window (save as PDF via browser).
 * For Retail/Wholesale: opens a thermal receipt in a new window and auto-prints.
 */

export const receiptService = {
  print: async (sale, t) => {
    if (!sale) return;

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
      businessPhone,
      businessEmail,
      businessAddress
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

    const user = useAuthStore.getState().user;
    const isManufacturing =
      (user?.organization?.business_type || "").toLowerCase() === 'manufacturing' ||
      (user?.organization?.business_type || "").toLowerCase() === 'manufacturer';

    // ─── A4 Invoice for Manufacturing ────────────────────────────────────────
    if (isManufacturing) {
      const items = (sale.items || sale.sale_items || []);
      const itemRows = items.map((item, idx) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="color:#94a3b8;font-weight:600;padding:13px 14px;font-size:12px;">${idx + 1}</td>
          <td style="padding:13px 14px;">
            <div style="font-size:13px;font-weight:600;color:#0f172a;">${item.product_name || item.product?.name || item.name || 'Item'}</div>
          </td>
          <td style="padding:13px 14px;color:#64748b;font-size:12px;font-weight:500;">
            ${item.variant?.name || item.product_variant?.name || item.variant_name || '-'}
          </td>
          <td style="text-align:center;font-weight:700;color:#334155;padding:13px 14px;font-size:13px;">${Number(item.quantity)}</td>
          <td style="text-align:right;color:#64748b;padding:13px 14px;font-size:13px;font-weight:500;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
          <td style="text-align:right;font-weight:700;color:#0f172a;padding:13px 14px;font-size:13px;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        </tr>
      `).join('');

      const discountRow = parseFloat(sale.discount_amount) > 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#059669;"><span>Discount</span><span style="font-weight:600;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>` : '';
      const taxRow = parseFloat(sale.tax_amount) > 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#475569;"><span>VAT / Tax</span><span style="font-weight:600;">${parseFloat(sale.tax_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>` : '';
      const adjRow = parseFloat(sale.adjustment || 0) !== 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#4338ca;"><span>Adjustment</span><span style="font-weight:600;">${parseFloat(sale.adjustment).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>` : '';
      const changeRow = parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount)
        ? `<div style="display:flex;justify-content:space-between;color:#059669;font-weight:800;margin-top:4px;"><span>Change Due</span><span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>` : '';

      const dist = sale.distributor || sale.customer;
      const distributorBlock = dist
        ? `<p style="margin:0;font-size:15px;font-weight:900;color:#0f172a;">${dist.name}</p>
           ${dist.company_name ? `<p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#475569;">${dist.company_name}</p>` : ''}
           ${dist.phone ? `<p style="margin:4px 0 0;font-size:12.5px;color:#64748b;">Tel: ${dist.phone}</p>` : ''}
           ${dist.email ? `<p style="margin:4px 0 0;font-size:12.5px;color:#64748b;">Email: ${dist.email}</p>` : ''}
           ${dist.address ? `<p style="margin:4px 0 0;font-size:12.5px;color:#64748b;">${dist.address}</p>` : ''}`
        : `<p style="margin:0;font-weight:600;color:#94a3b8;">Walk-in / No Distributor Selected</p>`;

      const invoiceDate = sale.created_at
        ? new Date(sale.created_at).toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'})
        : new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'});
      const invoiceTime = sale.created_at
        ? new Date(sale.created_at).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',hour12:true})
        : '';
      const companyAddress = sale.branch?.address || businessAddress || user?.organization?.address || '';
      const companyPhone = sale.branch?.phone || user?.organization?.phone || businessPhone || '';
      const companyEmail = sale.branch?.email || user?.organization?.email || businessEmail || '';

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${sale.invoice_number || 'DRAFT'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 6mm 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; line-height: 1.5; }
    .save-bar { position: sticky; top: 0; background: #1e293b; padding: 11px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
    .save-btn { background: #6366f1; color: #fff; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 13px; border: none; padding: 9px 22px; border-radius: 7px; cursor: pointer; letter-spacing: 0.3px; }
    .save-hint { color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 500; }
    .wrap { padding: 16px 20px; }
    .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; }
    .value { font-size: 13px; font-weight: 500; color: #334155; margin-top: 2px; }
    @media print {
      @page { size: A4; margin: 6mm 8mm; }
      .save-bar { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="save-bar">
    <span style="color:#fff;font-weight:600;font-size:14px;letter-spacing:0.2px;">Invoice &nbsp;/&nbsp; ${sale.invoice_number || 'DRAFT'}</span>
    <div style="display:flex;align-items:center;gap:14px;">
      <span class="save-hint">Change destination to <strong style="color:rgba(255,255,255,0.8);">Save as PDF</strong></span>
      <button class="save-btn" onclick="window.print()">&#8659;&nbsp; Download PDF</button>
    </div>
  </div>

  <div class="wrap">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:28px;border-bottom:1.5px solid #e2e8f0;margin-bottom:28px;">
      <div>
        ${businessLogo ? `<img src="${businessLogo}" style="height:52px;object-fit:contain;margin-bottom:14px;display:block;" />` : ''}
        <div style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${businessName || 'Inzeedo'}</div>
        ${companyAddress ? `<div style="margin-top:6px;font-size:12.5px;color:#64748b;font-weight:400;line-height:1.6;max-width:260px;">${companyAddress}</div>` : ''}
        ${companyPhone ? `<div style="margin-top:6px;font-size:12.5px;color:#64748b;display:flex;align-items:center;gap:6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          ${companyPhone}
        </div>` : ''}
        ${companyEmail ? `<div style="margin-top:4px;font-size:12.5px;color:#64748b;display:flex;align-items:center;gap:6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          ${companyEmail}
        </div>` : ''}
        ${taxId ? `<div style="margin-top:4px;font-size:12.5px;color:#64748b;display:flex;align-items:center;gap:6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          VAT/TIN: ${taxId}
        </div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:28px;font-weight:900;color:#6366f1;letter-spacing:-1.5px;text-transform:uppercase;">Invoice</div>
        <div style="margin-top:18px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <div class="label">Invoice Number</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:2px;">${sale.invoice_number || 'DRAFT'}</div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:6px;font-size:12px;font-weight:600;color:#64748b;margin-top:-6px;">
            <span>${invoiceDate}</span>
            ${invoiceTime ? `<span style="color:#cbd5e1;">&bull;</span><span>${invoiceTime.toUpperCase()}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Distributor -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:28px;">
      <div class="label" style="margin-bottom:10px;">Dispatched To</div>
      ${distributorBlock}
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-family:'Inter',sans-serif;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:5%;">#</th>
          <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:35%;">Item Description</th>
          <th style="padding:11px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:15%;">Pack / Size</th>
          <th style="padding:11px 14px;text-align:center;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:10%;">Qty</th>
          <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:17.5%;">Unit Price</th>
          <th style="padding:11px 14px;text-align:right;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;width:17.5%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals + QR -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:28px;">
      <div style="text-align:center;flex-shrink:0;">
        <img src="${qrUrl}" style="width:100px;height:100px;border:1px solid #e2e8f0;padding:7px;border-radius:10px;display:block;" />
        <div style="font-size:9px;font-weight:600;color:#94a3b8;margin-top:7px;max-width:120px;line-height:1.4;">Scan to verify authenticity</div>
      </div>
      <div style="flex:1;max-width:320px;border:1px solid #e2e8f0;border-radius:10px;padding:18px;font-family:'Inter',sans-serif;">
        <div style="display:flex;justify-content:space-between;margin-bottom:9px;">
          <span style="font-size:13px;color:#64748b;font-weight:500;">Subtotal</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${parseFloat(sale.total_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        ${discountRow}${taxRow}${adjRow}
        <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:800;color:#0f172a;border-top:1.5px dashed #cbd5e1;padding-top:13px;margin-top:10px;letter-spacing:-0.5px;">
          <span>Total</span>
          <span>${parseFloat(sale.payable_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        ${!isManufacturing ? `
        <div style="margin-top:14px;background:#f8fafc;padding:13px;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:12px;font-weight:500;color:#64748b;">Paid via ${(sale.payments?.[0]?.payment_method || sale.payment_method || 'Cash').toUpperCase()}</span>
            <span style="font-size:12px;font-weight:700;color:#0f172a;">${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
          ${changeRow}
        </div>
        ` : (sale.paid_amount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-top:12px;">
          <span style="font-size:13px;font-weight:500;color:#64748b;">Advance Payment</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${parseFloat(sale.paid_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#0f172a;border-top:1px solid #cbd5e1;padding-top:10px;margin-top:10px;">
          <span>Balance Due</span>
          <span>${parseFloat(sale.payable_amount - sale.paid_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        ` : '')}
      </div>
    </div>


    <!-- Footer -->
    <div style="margin-top:36px;padding-top:20px;border-top:1px solid #e2e8f0;">

      <!-- Terms & Conditions -->
      <div style="font-size:11.5px;color:#64748b;line-height:1.7;margin-bottom:28px;">
        ${refundPolicy ? `<div><span style="font-weight:700;color:#475569;">Terms &amp; Conditions:</span> ${refundPolicy}</div>` : ''}
        ${footerText ? `<div>${footerText}</div>` : '<div style="font-weight:600;color:#475569;">Thank you for your business!</div>'}
      </div>

      <!-- Authorized Signature (left-aligned) -->
      <div style="display:inline-block;text-align:left;">
        <div style="width:180px;height:48px;border-bottom:1.5px solid #334155;"></div>
        <div style="margin-top:6px;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.8px;">Authorized Signature</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${businessName || ''}</div>
      </div>

    </div>

    <!-- Powered By -->
    <div style="margin-top:20px;padding-top:12px;border-top:1px solid #f1f5f9;text-align:right;">
      <div style="font-size:10px;font-weight:600;color:#cbd5e1;letter-spacing:0.5px;">GENERATED BY INZEEDO ERP &nbsp;&bull;&nbsp; 2026</div>
    </div>
  </div>
</body>
</html>`;

      const a4Window = window.open('', '_blank', 'width=900,height=750');
      if (a4Window) {
        a4Window.document.write(html);
        a4Window.document.close();
      }
      return;
    }

    // ─── Thermal Receipt for Retail/Wholesale ────────────────────────────────
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
          .item-name { font-weight: bold; font-size: 11px; }
          .item-variant { font-size: 9px; opacity: 0.7; display: block; margin-top: 1px; }
          .grand-total { font-size: 14px; font-weight: 900; padding-top: 4px; margin-top: 4px; border-top: 2px solid #000; }
          .qr-container { margin: 15px 0; text-align: center; }
          .qr-image { width: 80px; height: 80px; }
          .sale-type { font-weight: bold; font-size: 10px; margin: 4px 0; border-bottom: 1px dashed #000; padding-bottom: 4px; padding-top: 4px; }
          @media print { body { padding: 4mm; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="center header">
          ${showLogo && businessLogo ? `<img src="${businessLogo}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 8px;" />` : ''}
          <div class="bold" style="font-size: 18px; line-height: 1.1;">${businessName || 'Inzeedo POS'}</div>
          <div style="opacity: 0.8; margin-top: 4px;">
            <div>${sale.branch?.address || ''}</div>
            <div>TEL: ${sale.branch?.phone || businessPhone || '+94 112 345 678'}</div>
            ${taxId ? `<div>VAT/TIN: ${taxId}</div>` : ''}
          </div>
          ${headerText && headerText !== 'Sale Invoice' ? `<div class="bold" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px;">${headerText}</div>` : ''}
        </div>

        <div class="divider"></div>
        
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

        ${sale.customer ? `<div class="row"><span>CUSTOMER:</span><span>${sale.customer.name}</span></div>` : ''}
        <div class="row"><span>USER:</span><span>${sale.cashier?.name || 'Staff User'}</span></div>
        ${terminalName ? `<div class="row" style="opacity: 0.6; font-size: 9px;"><span>TERMINAL:</span><span>${terminalName.toUpperCase()}</span></div>` : ''}

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
                  <div>
                    <span class="item-name">${Number(item.quantity)} @ ${
                      item.product_name || item.product?.name ||
                      item.product_variant?.product?.name || item.variant?.product?.name ||
                      item.name || 'Item'
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
          <div class="row"><span>${translate('checkout.subtotal')}:</span><span>${parseFloat(sale.total_amount).toLocaleString()}</span></div>
          ${parseFloat(sale.discount_amount) > 0 ? `<div class="row" style="color: #15803d; font-size: 10px;"><span>${translate('checkout.discount')}:</span><span>- ${parseFloat(sale.discount_amount).toLocaleString()}</span></div>` : ''}
          ${parseFloat(sale.tax_amount) > 0 ? `<div class="row"><span>${translate('checkout.vat')}:</span><span>${parseFloat(sale.tax_amount).toLocaleString()}</span></div>` : ''}
          ${parseFloat(sale.adjustment || 0) !== 0 ? `<div class="row"><span>${translate('checkout.adjustment')}:</span><span>${parseFloat(sale.adjustment).toLocaleString()}</span></div>` : ''}
          <div class="row grand-total"><span>${translate('pos.total')}:</span><span>${parseFloat(sale.payable_amount).toLocaleString()}</span></div>
        </div>

        <div style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px;">
          ${sale.payments && sale.payments.length > 0 ? sale.payments.map(pmt => `
            <div class="row" style="font-size: 11px;"><span class="uppercase">${pmt.payment_method} PAID:</span><span class="bold">${parseFloat(pmt.amount).toLocaleString()}</span></div>
          `).join('') : `
            <div class="row" style="font-size: 11px;"><span class="uppercase">${sale.payment_method || 'CASH'} PAID:</span><span class="bold">${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span></div>
          `}
          ${parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) ? `
            <div class="row" style="font-weight: bold;"><span>CHANGE:</span><span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span></div>
          ` : ''}
        </div>

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="Verification QR" />
          <div style="font-size: 7px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.4; font-weight: bold;">Scan for digital verification</div>
        </div>

        <div class="footer center">
          ${refundPolicy ? `<div style="border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 8px; font-size: 9px;"><span class="bold">REFUND/RETURN POLICY:</span><br/>${refundPolicy}</div>` : ''}
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
