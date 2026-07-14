"use client";

import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Receipt Service
 * Uses Capacitor Filesystem + Share for native PDF download (no Chrome popup).
 * Falls back to iframe-print for web/desktop environments.
 */

/**
 * Converts a Blob to a Base64 string.
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Strip the data URI prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Generates a PDF from an HTML string and shares it natively via Capacitor.
 * On web, falls back to a simple print dialog via hidden iframe.
 */
const generateAndSharePdf = async (htmlContent, filename = 'invoice.pdf', isA4 = false) => {
  // ─── Capacitor Native Path ─────────────────────────────────────────────
  try {
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const html2pdf = (await import('html2pdf.js')).default;

      // Create a temporary off-screen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = isA4 ? '794px' : '302px'; // A4 or 80mm thermal
      container.style.background = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const pdfOptions = isA4
        ? {
          margin: [8, 8, 8, 8],
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }
        : {
          margin: [4, 4, 4, 4],
          filename,
          image: { type: 'jpeg', quality: 0.90 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' },
        };

      // Generate PDF as a Blob
      const pdfBlob = await html2pdf().set(pdfOptions).from(container).outputPdf('blob');
      document.body.removeChild(container);

      // Convert blob to base64
      const base64Data = await blobToBase64(pdfBlob);

      // Write to Capacitor Cache directory
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Open native share sheet so user can Save/Print/WhatsApp etc.
      await Share.share({
        title: filename.replace('.pdf', ''),
        text: 'Invoice document',
        url: writeResult.uri,
        dialogTitle: 'Save or Share Invoice',
      });

      return;
    }
  } catch (err) {
    console.warn('[receiptService] Capacitor PDF path failed, falling back to iframe:', err);
  }

  // ─── Web / Fallback: Hidden iframe print ──────────────────────────────
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 2000);
  }, 500);
};

export const receiptService = {
  print: async (sale, t) => {
    if (!sale) return;

    const translate = t || ((key) => {
      const parts = key.split('.');
      const label = parts[parts.length - 1];
      return label.charAt(0) + label.slice(1).replace(/_/g, ' ');
    });

    const {
      showLogo,
      businessLogo,
      businessName,
      taxId,
      headerText,
      showFooterText,
      footerText,
      showRefundPolicy,
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
        <tr style="border-bottom:1px solid #ffffff;">
          <td style="color:#666666;font-weight:600;padding:13px 14px;font-size:12px;">${idx + 1}</td>
          <td style="padding:13px 14px;">
            <div style="font-size:13px;font-weight:600;color:#000000;">${item.product_name || item.product?.name || item.name || 'Item'}</div>
          </td>
          <td style="padding:13px 14px;color:#000000;font-size:12px;font-weight:500;">
            ${item.variant?.name || item.product_variant?.name || item.variant_name || '-'}
          </td>
          <td style="text-align:center;font-weight:700;color:#000000;padding:13px 14px;font-size:13px;">${Number(item.quantity)}</td>
          <td style="text-align:right;color:#000000;padding:13px 14px;font-size:13px;font-weight:500;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;font-weight:700;color:#000000;padding:13px 14px;font-size:13px;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const discountRow = parseFloat(sale.discount_amount) > 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#000000;"><span>Discount</span><span style="font-weight:600;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : '';
      const taxRow = parseFloat(sale.tax_amount) > 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#000000;"><span>VAT / Tax</span><span style="font-weight:600;">${parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : '';
      const adjRow = parseFloat(sale.adjustment || 0) !== 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;color:#000000;"><span>Adjustment</span><span style="font-weight:600;">${parseFloat(sale.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : '';
      const changeRow = parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount)
        ? `<div style="display:flex;justify-content:space-between;color:#000000;font-weight:800;margin-top:4px;"><span>Change Due</span><span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : '';

      const dist = sale.distributor || sale.customer;
      const distributorBlock = dist
        ? `<p style="margin:0;font-size:15px;font-weight:900;color:#000000;">${dist.name}</p>
           ${dist.company_name ? `<p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#000000;">${dist.company_name}</p>` : ''}
           ${dist.phone ? `<p style="margin:4px 0 0;font-size:12.5px;color:#000000;">Tel: ${dist.phone}</p>` : ''}
           ${dist.email ? `<p style="margin:4px 0 0;font-size:12.5px;color:#000000;">Email: ${dist.email}</p>` : ''}
           ${dist.address ? `<p style="margin:4px 0 0;font-size:12.5px;color:#000000;">${dist.address}</p>` : ''}`
        : `<p style="margin:0;font-weight:600;color:#666666;">Walk-in / No Distributor Selected</p>`;

      const invoiceDate = sale.created_at
        ? new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const invoiceTime = sale.created_at
        ? new Date(sale.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '';
      const companyAddress = sale.branch?.address || businessAddress || user?.organization?.address || '';
      const companyPhone = sale.branch?.phone || user?.organization?.phone || businessPhone || '';
      const companyEmail = sale.branch?.email || user?.organization?.email || businessEmail || '';

      const html = `
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .invoice-body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #000000; background: #fff; line-height: 1.5; }
    .save-bar { position: sticky; top: 0; background: #000000; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
    .save-btn { background: #000000; color: #fff; font-family: system-ui, sans-serif; font-weight: 700; font-size: 13px; border: 1px solid #fff; padding: 8px 16px; cursor: pointer; letter-spacing: 0.5px; }
    .save-hint { color: #ffffff; font-size: 12px; font-weight: 500; }
    .wrap { padding: 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
    @media print {
      @page { size: A4; margin: 10mm; }
      .save-bar { display: none; }
      .invoice-body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
  <div class="invoice-body">
    <div class="save-bar no-print">
      <span style="color:#fff;font-weight:700;font-size:14px;text-transform:uppercase;">Invoice / ${sale.invoice_number || 'DRAFT'}</span>
      <div style="display:flex;align-items:center;gap:14px;">
        <span class="save-hint">Change destination to <strong>Save as PDF</strong></span>
        <button class="save-btn" onclick="window.print()">DOWNLOAD PDF</button>
      </div>
    </div>

    <div class="wrap">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #000;margin-bottom:24px;">
        <div>
          ${businessLogo ? `<img src="${businessLogo}" style="height:48px;object-fit:contain;margin-bottom:12px;display:block;filter:grayscale(100%);" />` : ''}
          <div style="font-size:24px;font-weight:900;color:#000;letter-spacing:-0.5px;text-transform:uppercase;">${businessName || 'Inzeedo Manufacturing'}</div>
          ${companyAddress ? `<div style="margin-top:8px;font-size:12px;color:#333;font-weight:500;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${companyAddress}</div>` : ''}
          ${companyPhone ? `<div style="margin-top:4px;font-size:12px;color:#333;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>${companyPhone}</div>` : ''}
          ${companyEmail ? `<div style="margin-top:2px;font-size:12px;color:#333;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${companyEmail}</div>` : ''}
          ${taxId ? `<div style="margin-top:2px;font-size:12px;color:#000;font-weight:700;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>VAT/TIN: ${taxId}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:32px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;display:inline-block;padding-bottom:4px;margin-bottom:12px;">Tax Invoice</div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
            <span style="font-weight:400;color:#666;">INV NO:</span>
            <span style="font-weight:400;color:#000;">${sale.invoice_number || 'DRAFT'}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:4px;">
            <span style="font-weight:400;color:#666;">DATE:</span>
            <span style="font-weight:400;color:#000;">${invoiceDate}</span>
          </div>
        </div>
      </div>

      <!-- Distributor -->
      <div style="border:2px solid #000;padding:20px;margin-bottom:24px;">
        <div style="font-size:10px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:12px;display:inline-block;">Billed To</div>
        ${sale.customer ? `
        <div style="display:flex;justify-content:space-between;">
          <div>
            <div style="font-size:16px;font-weight:900;color:#000;">${sale.customer.name}</div>
            ${sale.customer.address ? `<div style="margin-top:6px;font-size:12px;color:#333;font-weight:500;max-width:300px;">${sale.customer.address}</div>` : ''}
          </div>
          <div style="text-align:right;display:flex;flex-direction:column;justify-content:flex-end;">
            ${sale.customer.phone ? `<div style="font-size:12px;font-weight:700;color:#000;">P: ${sale.customer.phone}</div>` : ''}
            ${sale.customer.email ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:4px;">E: ${sale.customer.email}</div>` : ''}
          </div>
        </div>` : '<div style="font-size:14px;font-weight:700;color:#666;">Walk-in / No Distributor Selected</div>'}
      </div>

      <!-- Items Table -->
      <div style="border-top:2px solid #000;border-bottom:2px solid #000;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:12px;text-align:left;font-size:10px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;width:5%;">#</th>
              <th style="padding:12px;text-align:left;font-size:10px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;width:45%;">Item Description</th>
              <th style="padding:12px;text-align:center;font-size:10px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;width:15%;">Qty</th>
              <th style="padding:12px;text-align:right;font-size:10px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;width:17.5%;">Unit Price</th>
              <th style="padding:12px;text-align:right;font-size:10px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;width:17.5%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || sale.sale_items || []).map((item, idx) => `
              <tr>
                <td style="padding:12px;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${idx + 1}</td>
                <td style="padding:12px;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${item.product_name || item.product?.name || item.name || 'Item'}</td>
                <td style="padding:12px;text-align:center;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${Number(item.quantity)}</td>
                <td style="padding:12px;text-align:right;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style="padding:12px;text-align:right;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals & QR -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:32px;">
        <div style="text-align:center;">
          <div style="border:2px solid #000;padding:8px;display:inline-block;margin-bottom:8px;">
            <img src="${qrUrl}" style="width:100px;height:100px;display:block;" />
          </div>
          <div style="font-size:10px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;max-width:140px;line-height:1.4;">Scan to Verify Authenticity</div>
        </div>
        
        <div style="flex:1;max-width:400px;">
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;">
              <span style="font-weight:700;">Subtotal</span>
              <span style="font-weight:700;">${parseFloat(sale.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            ${parseFloat(sale.discount_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Discount</span><span style="font-weight:700;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
            ${parseFloat(sale.tax_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">VAT / Tax</span><span style="font-weight:700;">${parseFloat(sale.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
            ${parseFloat(sale.adjustment || 0) !== 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Adjustment</span><span style="font-weight:700;">${parseFloat(sale.adjustment).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:4px solid #000;padding-top:16px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:900;text-transform:uppercase;">Total Payable</span>
            <span style="font-size:20px;font-weight:900;">${parseFloat(sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>

          <div style="border:2px solid #000;padding:16px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:8px;">
              <span>Amount Paid (${sale.payments?.[0]?.payment_method || sale.payment_method || 'CASH'})</span>
              <span>${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            ${parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) ? `
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;border-top:1px dashed #000;padding-top:8px;">
                <span>Change Due</span>
                <span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:48px;padding-top:24px;border-top:2px solid #000;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="max-width:60%;">
          ${refundPolicy ? `
            <div style="margin-bottom:16px;">
              <strong style="font-size:10px;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;display:inline-block;">Terms &amp; Conditions</strong>
              <p style="font-size:10px;font-weight:500;line-height:1.6;margin-top:4px;">${refundPolicy}</p>
            </div>
          ` : ''}
          ${footerText ? `<p style="font-size:10px;font-weight:500;margin:0;">${footerText}</p>` : `<p style="font-size:16px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:-0.5px;">Thank you for your business.</p>`}
        </div>
        <div style="text-align:right;">
          <div style="width:180px;border-top:1px solid #000;margin-bottom:8px;margin-left:auto;"></div>
          <div style="font-size:10px;font-weight:500;">Authorized Signature</div>
        </div>
      </div>
      
      <div style="margin-top:auto;padding-top:32px;text-align:right;font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">
        Generated by Inzeedo ERP System &bull; 2026
      </div>
    </div>
  </div>`;

      const invoiceFilename = `Invoice-${sale.invoice_number || 'draft'}.pdf`;
      await generateAndSharePdf(html, invoiceFilename, true);
      return;
    }

    // ─── Thermal Receipt for Retail/Wholesale ────────────────────────────────
    const width = paperWidth === '58mm' ? '58mm' : '80mm';

    const receiptHtml = `
        <style>
          @page { size: ${width} auto; margin: 0; }
          .invoice-body { 
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
          th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; font-size: 10px;  }
          td { padding: 6px 0; vertical-align: top; border-bottom: 1px dashed rgba(0,0,0,0.15); }
          .item-name { font-weight: bold; font-size: 11px; }
          .item-variant { font-size: 9px; opacity: 0.7; display: block; margin-top: 1px; }
          .grand-total { font-size: 14px; font-weight: 900; padding-top: 4px; margin-top: 4px; border-top: 2px solid #000; }
          .qr-container { margin: 15px 0; text-align: center; }
          .qr-image { width: 80px; height: 80px; }
          .sale-type { font-weight: bold; font-size: 10px; margin: 4px 0; border-bottom: 1px dashed #000; padding-bottom: 4px; padding-top: 4px; }
          @media print { .invoice-body { padding: 4mm; } .no-print { display: none; } }
        </style>
        <div class="invoice-body">
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
          ${(sale.is_wholesale ? 'WHOLESALE' : 'RETAIL')} SALE
        </div>

        ${sale.customer ? `<div class="row"><span>CUSTOMER:</span><span>${sale.customer.name}</span></div>` : ''}
        <div class="row"><span>USER:</span><span>${sale.cashier?.name || 'Staff User'}</span></div>
        ${terminalName ? `<div class="row" style="opacity: 0.6; font-size: 9px;"><span>TERMINAL:</span><span>${terminalName}</span></div>` : ''}

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
                    <span class="item-name">${Number(item.quantity)} @ ${item.product_name || item.product?.name ||
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
          ${parseFloat(sale.discount_amount) > 0 ? `<div class="row" style="color: #000000; font-size: 10px;"><span>${translate('checkout.discount')}:</span><span>- ${parseFloat(sale.discount_amount).toLocaleString()}</span></div>` : ''}
          ${parseFloat(sale.tax_amount) > 0 ? `<div class="row"><span>${translate('checkout.vat')}:</span><span>${parseFloat(sale.tax_amount).toLocaleString()}</span></div>` : ''}
          ${parseFloat(sale.adjustment || 0) !== 0 ? `<div class="row"><span>${translate('checkout.adjustment')}:</span><span>${parseFloat(sale.adjustment).toLocaleString()}</span></div>` : ''}
          <div class="row grand-total"><span>${translate('pos.total')}:</span><span>${parseFloat(sale.payable_amount).toLocaleString()}</span></div>
        </div>

        <div style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px;">
          ${sale.payments && sale.payments.length > 0 ? sale.payments.map(pmt => `
            <div class="row" style="font-size: 11px;"><span class="">${pmt.payment_method} PAID:</span><span class="bold">${parseFloat(pmt.amount).toLocaleString()}</span></div>
          `).join('') : `
            <div class="row" style="font-size: 11px;"><span class="">${sale.payment_method || 'CASH'} PAID:</span><span class="bold">${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span></div>
          `}
          ${parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) ? `
            <div class="row" style="font-weight: bold;"><span>CHANGE:</span><span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span></div>
          ` : ''}
        </div>

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="Verification QR" />
          <div style="font-size: 7px; margin-top: 4px;  letter-spacing: 1.5px; opacity: 0.4; font-weight: bold;">Scan for digital verification</div>
        </div>

        <div class="footer center">
          ${showRefundPolicy && refundPolicy ? `<div style="border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 8px; font-size: 9px;"><span class="bold">REFUND/RETURN POLICY:</span><br/>${refundPolicy}</div>` : ''}
          ${showFooterText && footerText ? `<div style="font-size: 10px; margin-bottom: 8px; white-space: pre-wrap;">${footerText}</div>` : (showFooterText ? '<div style="font-size: 10px; margin-bottom: 8px; font-weight: bold;">Thank you!</div>' : '')}
          <div style="opacity: 0.5; margin-top: 12px; line-height: 1.1;">
            <div class="bold" style="font-size: 8px;">A next-generation enterprise solution by Inzeedo</div>
            <div style="font-size: 7px;">© 2026 Inzeedo. All rights reserved.</div>
          </div>
        </div>
        </div>
        </div>
      `;

    const receiptFilename = `Receipt-${sale.invoice_number || 'draft'}.pdf`;
    await generateAndSharePdf(receiptHtml, receiptFilename, false);
  },

  /**
   * printDirect: Opens the OS native print dialog (Android PrintManager / iOS AirPrint).
   * Supports paired Bluetooth and USB printers automatically.
   */
  printDirect: async (sale, t) => {
    if (!sale) return;

    const {
      businessLogo, businessName, taxId,
      showFooterText, footerText, showRefundPolicy, refundPolicy, paperWidth,
      businessPhone, businessAddress, businessEmail
    } = useSettingsStore.getState();

    const user = useAuthStore.getState().user;
    const isManufacturing =
      (user?.organization?.business_type || '').toLowerCase() === 'manufacturing' ||
      (user?.organization?.business_type || '').toLowerCase() === 'manufacturer';

    const formatDate = (dateStr) => {
      try {
        return new Date(dateStr || new Date()).toLocaleString('en-GB', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(',', '');
      } catch (e) { return dateStr; }
    };

    const qrData = JSON.stringify({
      invoice: sale.invoice_number || 'Draft',
      date: sale.created_at ? sale.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      total: (sale.payable_amount || 0).toString()
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

    let htmlContent;

    if (isManufacturing) {
      const items = (sale.items || sale.sale_items || []);
      const companyAddress = sale.branch?.address || businessAddress || user?.organization?.address || '';
      const companyPhone = sale.branch?.phone || user?.organization?.phone || businessPhone || '';
      const companyEmail = sale.branch?.email || user?.organization?.email || businessEmail || '';
      const invoiceDate = new Date(sale.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const itemRows = items.map((item, idx) =>
        `<tr>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-weight:400;font-size:12px;">${idx + 1}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-weight:400;font-size:12px;">${item.product_name || item.product?.name || item.name || 'Item'}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:center;font-weight:400;font-size:12px;">${Number(item.quantity)}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:400;font-size:12px;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:400;font-size:12px;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>`
      ).join('');

      htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${sale.invoice_number || 'DRAFT'}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, Helvetica, Arial, sans-serif; font-size: 12px; color: #000; background: #fff; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 12px; font-size: 10px; font-weight: 900; border-bottom: 2px solid #000; text-align: left; text-transform: uppercase; }
  td { padding: 12px; font-weight: 400; border-bottom: 1px solid #e5e5e5; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>

<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #000;margin-bottom:24px;">
  <div>
    ${businessLogo ? `<img src="${businessLogo}" style="height:48px;object-fit:contain;margin-bottom:12px;display:block;filter:grayscale(100%);" />` : ''}
    <div style="font-size:24px;font-weight:900;color:#000;letter-spacing:-0.5px;text-transform:uppercase;">${businessName || 'Inzeedo Manufacturing'}</div>
    ${companyAddress ? `<div style="margin-top:8px;font-size:12px;color:#333;font-weight:500;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${companyAddress}</div>` : ''}
    ${companyPhone ? `<div style="margin-top:4px;font-size:12px;color:#333;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>${companyPhone}</div>` : ''}
    ${companyEmail ? `<div style="margin-top:2px;font-size:12px;color:#333;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${companyEmail}</div>` : ''}
    ${taxId ? `<div style="margin-top:2px;font-size:12px;color:#000;font-weight:700;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>VAT/TIN: ${taxId}</div>` : ''}
  </div>
  <div style="text-align:right;">
    <div style="font-size:32px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;display:inline-block;padding-bottom:4px;margin-bottom:12px;">Tax Invoice</div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
      <span style="font-weight:400;color:#666;">INV NO:</span>
      <span style="font-weight:400;color:#000;">${sale.invoice_number || 'DRAFT'}</span>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:4px;">
      <span style="font-weight:400;color:#666;">DATE:</span>
      <span style="font-weight:400;color:#000;">${invoiceDate}</span>
    </div>
  </div>
</div>

<div style="border:2px solid #000;padding:20px;margin-bottom:24px;">
  <div style="font-size:10px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:12px;display:inline-block;">Billed To</div>
  ${(() => { const dist = sale.distributor || sale.customer; return dist ? `
  <div style="display:flex;justify-content:space-between;">
    <div>
      <div style="font-size:16px;font-weight:900;color:#000;">${dist.name || ''}</div>
      ${dist.address ? `<div style="margin-top:6px;font-size:12px;color:#333;font-weight:500;max-width:300px;">${dist.address}</div>` : ''}
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;justify-content:flex-end;">
      ${dist.phone ? `<div style="font-size:12px;font-weight:700;color:#000;">P: ${dist.phone}</div>` : ''}
      ${dist.email ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:4px;">E: ${dist.email}</div>` : ''}
    </div>
  </div>` : '<div style="font-size:14px;font-weight:700;color:#666;">Walk-in / No Distributor Selected</div>'; })()}
</div>

<div style="border-top:2px solid #000;border-bottom:2px solid #000;margin-bottom:24px;">
  <table>
    <thead>
      <tr>
        <th style="width:5%;">#</th>
        <th style="width:45%;">Item Description</th>
        <th style="width:15%;text-align:center;">Qty</th>
        <th style="width:17.5%;text-align:right;">Unit Price</th>
        <th style="width:17.5%;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:32px;">
  <div style="text-align:center;">
    <div style="border:2px solid #000;padding:8px;display:inline-block;margin-bottom:8px;">
      <img src="${qrUrl}" style="width:100px;height:100px;display:block;" />
    </div>
    <div style="font-size:10px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;max-width:140px;line-height:1.4;">Scan to Verify Authenticity</div>
  </div>
  
  <div style="flex:1;max-width:400px;">
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;">
        <span style="font-weight:700;">Subtotal</span>
        <span style="font-weight:700;">${parseFloat(sale.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      </div>
      ${parseFloat(sale.discount_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Discount</span><span style="font-weight:700;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
      ${parseFloat(sale.tax_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">VAT / Tax</span><span style="font-weight:700;">${parseFloat(sale.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
    </div>
    
    <div style="display:flex;justify-content:space-between;align-items:center;border-top:4px solid #000;padding-top:16px;margin-bottom:24px;">
      <span style="font-size:20px;font-weight:900;text-transform:uppercase;">Total Payable</span>
      <span style="font-size:20px;font-weight:900;">${parseFloat(sale.payable_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
    </div>
  </div>
</div>

<div style="margin-top:48px;padding-top:24px;border-top:2px solid #000;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="max-width:60%;">
    ${showRefundPolicy && refundPolicy ? `
      <div style="margin-bottom:16px;">
        <strong style="font-size:10px;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;display:inline-block;">Terms &amp; Conditions</strong>
        <p style="font-size:10px;font-weight:500;line-height:1.6;margin-top:4px;">${refundPolicy}</p>
      </div>
    ` : ''}
    ${showFooterText && footerText ? `<p style="font-size:10px;font-weight:500;margin:0;">${footerText}</p>` : (showFooterText ? `<p style="font-size:16px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:-0.5px;">Thank you for your business.</p>` : '')}
  </div>
  <div style="text-align:right;">
    <div style="width:180px;border-top:1px solid #000;margin-bottom:8px;margin-left:auto;"></div>
    <div style="font-size:10px;font-weight:500;">Authorized Signature</div>
  </div>
</div>

<div style="margin-top:auto;padding-top:32px;text-align:right;font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">
  Generated by Inzeedo ERP System &bull; 2026
</div>
</body></html>`;
    } else {
      const width = paperWidth === '58mm' ? '58mm' : '80mm';
      htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${sale.invoice_number}</title>
<style>
  @page{size:${width} auto;margin:0}
  body{width:${width};margin:0;padding:6mm 4mm;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.3;color:#000;background:#fff}
  .c{text-align:center}.r{text-align:right}.b{font-weight:bold}
  .d{border-top:1px dashed #000;margin:4px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;border-bottom:1px solid #000;padding:3px 0;font-size:10px}
  td{padding:4px 0;border-bottom:1px dashed #000;vertical-align:top}
  .tot{font-size:13px;font-weight:900;border-top:2px solid #000;padding-top:4px;margin-top:3px;display:flex;justify-content:space-between}
</style></head><body>
<div class="c b" style="font-size:16px;">${businessName || 'Inzeedo POS'}</div>
${businessAddress ? `<div class="c" style="font-size:10px;">${businessAddress}</div>` : ''}
${businessPhone ? `<div class="c" style="font-size:10px;">Tel: ${businessPhone}</div>` : ''}
<div class="d"></div>
<div class="row"><span>Invoice:</span><span class="b">${sale.invoice_number || 'DRAFT'}</span></div>
<div class="row"><span>Date:</span><span>${formatDate(sale.created_at)}</span></div>
${sale.customer ? `<div class="row"><span>Customer:</span><span class="b">${sale.customer.name || ''}</span></div>${sale.customer.phone ? `<div class="row" style="font-size:9px;"><span>Tel:</span><span>${sale.customer.phone}</span></div>` : ''}` : ''}
<div class="d"></div>
<table><thead><tr>
  <th style="width:50%;">Item</th><th class="r" style="width:25%;">Price</th><th class="r" style="width:25%;">Amt</th>
</tr></thead><tbody>
${(sale.items || sale.sale_items || []).map(item => `<tr>
  <td>${Number(item.quantity)} x ${item.product_name || item.product?.name || item.name || 'Item'}</td>
  <td class="r">${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
  <td class="r b">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString()}</td>
</tr>`).join('')}
</tbody></table>
<div class="row" style="margin-top:5px;"><span>Subtotal:</span><span>${parseFloat(sale.total_amount || 0).toLocaleString()}</span></div>
${parseFloat(sale.discount_amount) > 0 ? `<div class="row"><span>Discount:</span><span>- ${parseFloat(sale.discount_amount).toLocaleString()}</span></div>` : ''}
${parseFloat(sale.tax_amount) > 0 ? `<div class="row"><span>Tax:</span><span>${parseFloat(sale.tax_amount).toLocaleString()}</span></div>` : ''}
<div class="tot"><span>TOTAL:</span><span>${parseFloat(sale.payable_amount || 0).toLocaleString()}</span></div>
<div class="d"></div>
${(sale.payments && sale.payments.length > 0 ? sale.payments : [{ payment_method: sale.payment_method || 'Cash', amount: sale.paid_amount || sale.payable_amount }])
          .map(p => `<div class="row"><span>${p.payment_method} Paid:</span><span class="b">${parseFloat(p.amount).toLocaleString()}</span></div>`).join('')}
${showRefundPolicy && refundPolicy ? `<div class="c" style="margin-top:10px;font-size:9px;">${refundPolicy}</div>` : ''}
${showFooterText && footerText ? `<div class="c b" style="margin-top:7px;font-size:10px;">${footerText}</div>` : (showFooterText ? '<div class="c b" style="margin-top:7px;font-size:10px;">Thank you!</div>' : '')}
<img src="${qrUrl}" style="width:70px;height:70px;display:block;margin:10px auto 0;"/>
</body></html>`;
    }

    // Inject a hidden iframe and trigger the OS native print dialog.
    // On Android Capacitor WebView this calls Android PrintManager,
    // which discovers paired Bluetooth and USB printers automatically.
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('[receiptService] printDirect failed:', e);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 3000);
    }, 800);
  }
};
