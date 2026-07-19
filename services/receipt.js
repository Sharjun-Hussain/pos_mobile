"use client";

import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { EscPosEncoder } from './esc-pos';
import LanPrinter from './LanPrinter';

/**
 * Fetches an image URL using the stored auth token and returns a base64 data URI.
 * This is required because `new Image()` cannot send Authorization headers,
 * so loading a protected backend URL directly causes garbage bitmap output.
 */
const fetchLogoAsDataUri = async (url) => {
  if (!url) return null;
  // Already a data URI — use directly
  if (url.startsWith('data:')) return url;
  try {
    const token = useAuthStore.getState().token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[receiptService] Logo fetch failed:', e);
    return null;
  }
};

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
const generateAndSharePdf = async (htmlContent, filename = 'invoice.pdf', isA4 = false, action = 'share') => {
  // ─── Capacitor Native Path ─────────────────────────────────────────────
  try {
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const html2pdf = (await import('html2pdf.js')).default;

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

      // Generate PDF as a Blob directly from the HTML string.
      // html2pdf will handle creating an isolated rendering context safely.
      const pdfBlob = await html2pdf().set(pdfOptions).from(htmlContent).outputPdf('blob');

      // Convert blob to base64
      const base64Data = await blobToBase64(pdfBlob);

      // Write to Capacitor Cache directory (for share) or Documents (for download)
      const targetDirectory = action === 'download' ? Directory.Documents : Directory.Cache;

      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: targetDirectory,
        recursive: true,
      });

      if (action === 'download') {
        try {
          const { Toast } = await import('@capacitor/toast');
          await Toast.show({
            text: `Saved to Documents: ${filename}`,
            duration: 'long'
          });

          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const { FileOpener } = await import('@capacitor-community/file-opener');
          
          await LocalNotifications.requestPermissions();

          // Add listener to open the file
          if (!window._fileOpenerListenerAdded) {
            LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
              const fileUri = notificationAction.notification.extra?.fileUri;
              if (fileUri) {
                FileOpener.open({ filePath: fileUri, contentType: 'application/pdf' })
                  .catch(e => console.error('Error opening file:', e));
              }
            });
            window._fileOpenerListenerAdded = true;
          }

          await LocalNotifications.schedule({
            notifications: [
              {
                title: 'Invoice Downloaded',
                body: `Tap to view ${filename}`,
                id: Math.floor(Math.random() * 100000) + 1,
                schedule: { at: new Date(Date.now() + 500) },
                extra: { fileUri: writeResult.uri }
              }
            ]
          });

        } catch (e) {
          console.error('[receiptService] Download notification error:', e);
        }
      } else {
        // Open native share sheet so user can Save/Print/WhatsApp etc.
        await Share.share({
          title: filename.replace('.pdf', ''),
          text: 'Invoice document',
          url: writeResult.uri,
          dialogTitle: 'Save or Share Invoice',
        });
      }

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

const printViaLan = async (sale, t) => {
  const { useLanPrinter, printerIp, printerPort, showLogo, businessLogo, businessName, businessAddress, businessPhone, taxId, headerText, showRefundPolicy, refundPolicy, showFooterText, footerText, showBarcode, paperWidth } = useSettingsStore.getState();

  if (!useLanPrinter || !printerIp) return false;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr || new Date());
      return date.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
    } catch (e) {
      return dateStr;
    }
  };

  try {
    const encoder = new EscPosEncoder();
    encoder.initialize();

    // FORCE BOLD FOR THE ENTIRE RECEIPT TO MAKE IT DARK
    encoder.bold(true);

    // Header
    encoder.align('center');

    if (showLogo && businessLogo) {
      try {
        // Fetch logo as authenticated data URI to avoid sending garbage bytes
        // when the backend URL requires an Authorization header.
        const logoDataUri = await fetchLogoAsDataUri(businessLogo);
        if (logoDataUri) {
          await encoder.image(logoDataUri, paperWidth === '80mm' ? 384 : 256);
          encoder.feed(1);
        }
      } catch (err) {
        console.error("Failed to print logo", err);
      }
    }

    // size(1, 2) = double HEIGHT only, keeping full line width (46 chars on 80mm).
    // size(2, 2) would halve the usable width to ~23 chars, causing long names to wrap.
    encoder.size(1, 2).line(businessName?.toUpperCase() || 'INZEEDO POS').size(1, 1);

    if (businessAddress) encoder.line(businessAddress.toUpperCase());
    if (businessPhone) encoder.line(`TEL: ${businessPhone}`);
    if (taxId) encoder.line(`VAT/TIN: ${taxId}`);

    const lineLength = paperWidth === '80mm' ? 46 : 32;

    encoder.divider(lineLength, '=').align('left');

    const invStr = sale.invoice_number || 'DRAFT';
    encoder.line(`INVOICE:${' '.repeat(Math.max(1, lineLength - 8 - invStr.length))}${invStr}`);
    const dateStr = formatDate(sale.created_at);
    encoder.line(`DATE:${' '.repeat(Math.max(1, lineLength - 5 - dateStr.length))}${dateStr}`);

    encoder.divider(lineLength, '=');

    // Type & User line
    const typeStr = sale.is_wholesale !== undefined ? (sale.is_wholesale ? 'WHOLESALE POS.SALE' : 'RETAIL POS.SALE') : 'POS.SALE';
    encoder.align('center').line(typeStr).align('left');
    encoder.divider(lineLength, '-');
    const customerStr = sale.customer?.name?.toUpperCase() || sale.customer_name?.toUpperCase();
    if (customerStr) {
      encoder.line(`CUSTOMER:${' '.repeat(Math.max(1, lineLength - 9 - customerStr.length))}${customerStr}`);
    }
    const userStr = sale.cashier?.name?.toUpperCase() || 'STAFF';
    encoder.line(`USER:${' '.repeat(Math.max(1, lineLength - 5 - userStr.length))}${userStr}`);

    encoder.divider(lineLength, '=');

    // Items Table Header
    encoder.line(lineLength === 46 ? '# DESCRIPTION         QTY    PRICE      AMOUNT' : '# DESCRIPTION  QTY  PRICE AMOUNT');
    encoder.divider(lineLength, '=');

    // Items
    let totalMrpSaved = 0;
    const items = sale.items || sale.sale_items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const maxNameLen = lineLength === 46 ? 46 : 32;
      const rawProdName = (item.product_name || item.product?.name || item.name || 'Item').toUpperCase();
      const itemName = `${i + 1} ${rawProdName}`.substring(0, maxNameLen);
      encoder.line(itemName);

      const variantName = (item.variant?.name || item.product_variant?.name || item.variant_name || '').toUpperCase();
      if (variantName && variantName !== rawProdName) {
        encoder.line(`  - ${variantName}`.substring(0, maxNameLen));
      }

      const priceStr = parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const lineTotal = parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const qtyStr = `${Number(item.quantity)} x ${priceStr}`;

      const spaces = lineLength - qtyStr.length - lineTotal.length - 3;
      encoder.line(`${' '.repeat(Math.max(0, spaces > 0 ? spaces : 16))}${qtyStr}   ${lineTotal}`);

      const discount = parseFloat(item.discount_amount || 0);
      if (discount > 0) {
        totalMrpSaved += discount;
        encoder.line(`  SAVE: ${discount.toLocaleString()}`);
      }
    }

    encoder.divider(lineLength, '=');

    // Totals
    const subtotalStr = parseFloat(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    encoder.line(`SUB TOTAL:${' '.repeat(Math.max(1, lineLength - 10 - subtotalStr.length))}${subtotalStr}`);

    if (totalMrpSaved > 0) {
      const savedStr = totalMrpSaved.toLocaleString();
      encoder.line(`YOU SAVED (MRP):${' '.repeat(Math.max(1, lineLength - 16 - savedStr.length))}${savedStr}`);
    } else if (parseFloat(sale.discount_amount) > 0) {
      const discountStr = parseFloat(sale.discount_amount).toLocaleString();
      encoder.line(`YOU SAVED:${' '.repeat(Math.max(1, lineLength - 10 - discountStr.length))}${discountStr}`);
    }

    if (parseFloat(sale.tax_amount) > 0) {
      const taxStr = parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
      encoder.line(`TAX:${' '.repeat(Math.max(1, lineLength - 4 - taxStr.length))}${taxStr}`);
    }
    if (parseFloat(sale.adjustment || 0) !== 0) {
      const adjStr = parseFloat(sale.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 });
      encoder.line(`ADJUSTMENT:${' '.repeat(Math.max(1, lineLength - 11 - adjStr.length))}${adjStr}`);
    }

    encoder.divider(lineLength, '=');
    const totalStr = parseFloat(sale.payable_amount || 0).toLocaleString();
    const bigLineLen = Math.floor(lineLength / 2);
    encoder.size(2, 2);
    encoder.line(`TOTAL:${' '.repeat(Math.max(1, bigLineLen - 6 - totalStr.length))}${totalStr}`);
    encoder.size(1, 1);
    encoder.divider(lineLength, '=');

    // Payments
    const parseAmt = (val) => parseFloat(String(val || 0).replace(/,/g, '')) || 0;

    if (sale.payments && sale.payments.length > 0) {
      let totalPaid = 0;
      sale.payments.forEach(pmt => {
        const amt = parseAmt(pmt.amount);
        totalPaid += amt;
        const methodStr = `${(pmt.payment_method || 'CASH').toUpperCase()} PAID:`;
        const amtStr = amt.toLocaleString();
        encoder.line(`${methodStr}${' '.repeat(Math.max(1, lineLength - methodStr.length - amtStr.length))}${amtStr}`);
      });

      const payableAmount = parseAmt(sale.payable_amount);
      if (totalPaid > payableAmount) {
        const changeStr = (totalPaid - payableAmount).toLocaleString();
        encoder.line(`CHANGE:${' '.repeat(Math.max(1, lineLength - 7 - changeStr.length))}${changeStr}`);
      }
    } else {
      let paidAmount = parseAmt(sale.paid_amount || sale.payable_amount);
      const payableAmount = parseAmt(sale.payable_amount);

      const methodStr = `${(sale.payment_method || 'CASH').toUpperCase()} PAID:`;
      const amtStr = paidAmount.toLocaleString();
      encoder.line(`${methodStr}${' '.repeat(Math.max(1, lineLength - methodStr.length - amtStr.length))}${amtStr}`);

      if (paidAmount > payableAmount) {
        const changeStr = (paidAmount - payableAmount).toLocaleString();
        encoder.line(`CHANGE:${' '.repeat(Math.max(1, lineLength - 7 - changeStr.length))}${changeStr}`);
      }
    }

    encoder.divider(lineLength, '=');

    // Footer & Barcode
    encoder.align('center');
    if (showRefundPolicy && refundPolicy) encoder.line(refundPolicy.toUpperCase());

    if (showFooterText && footerText) {
      encoder.line(footerText.toUpperCase());
    } else {
      encoder.line('THANK YOU FOR YOUR BUSINESS!');
      encoder.line('PLEASE VISIT AGAIN.');
    }

    encoder.newline();
    encoder.line('ERP SYSTEM FROM INZEEDO');
    encoder.line('(c) 2026 INZEEDO.LK | +94785706441');

    encoder.newline();
    try {
      if (showBarcode && sale.invoice_number) {
        encoder.barcode(sale.invoice_number);
      }
    } catch (e) { }

    encoder.newline().newline().cut();

    const data = encoder.encode();
    const res = await LanPrinter.connect({ ip: printerIp, port: printerPort || 9100 });
    if (res.success) {
      await LanPrinter.print({ ip: printerIp, port: printerPort || 9100, data });
      try {
        const { Toast } = await import('@capacitor/toast');
        await Toast.show({ text: 'Printed to LAN Printer', duration: 'short' });
      } catch (e) { }
      return true;
    }
    return false;
  } catch (err) {
    console.error('LAN Print Error:', err);
    return false;
  }
};

export const receiptService = {
  print: async (sale, t, actionType = 'download') => {
    if (!sale) return;

    const { paperWidth } = useSettingsStore.getState();
    const isA4Layout = paperWidth === 'A4';

    try {
      const { Capacitor } = await import('@capacitor/core');
      const user = useAuthStore.getState().user;
      const isManufacturing = (user?.organization?.business_type || '').toLowerCase() === 'manufacturing' || (user?.organization?.business_type || '').toLowerCase() === 'manufacturer';

      // NEVER send A4 layout to thermal printer
      if (!isA4Layout && Capacitor.isNativePlatform()) {
        const lanSuccess = await printViaLan(sale, t);
        if (lanSuccess) return;
      }
    } catch (e) {
      // Ignore if Capacitor is missing
    }

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

    // ─── A4 Invoice for A4 Setting ────────────────────────────────────────
    if (paperWidth === 'A4') {
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
    :root { color-scheme: light only; }
    @page { size: A4; margin: 8mm; }
    .invoice-body * { box-sizing: border-box; margin: 0; padding: 0; color: #000 !important; }
    .invoice-body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #000000; background: #fff; line-height: 1.5; }
    .invoice-body .save-bar { position: sticky; top: 0; background: #000000; padding: 11px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
    .invoice-body .save-btn { background: #000000; color: #fff; font-family: system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 13px; border: none; padding: 9px 22px; border-radius: 7px; cursor: pointer; letter-spacing: 0.3px; }
    .invoice-body .save-hint { color: #ffffff; font-size: 12px; font-weight: 500; }
    .invoice-body .wrap { padding: 0; box-sizing: border-box; min-height: 270mm; display: flex; flex-direction: column; }
    .invoice-body .label { font-size: 10px; font-weight: 700; color: #000;  letter-spacing: 1.2px; }
    .invoice-body .value { font-size: 13px; font-weight: 500; color: #000; margin-top: 2px; }
    @media print {
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
          <div style="font-size:24px;font-weight:900;color:#000 !important;letter-spacing:-0.5px;text-transform:uppercase;">${businessName || 'Inzeedo Manufacturing'}</div>
          ${companyAddress ? `<div style="margin-top:8px;font-size:12px;color:#000 !important;font-weight:500;">${companyAddress}</div>` : ''}
          ${companyPhone ? `<div style="margin-top:4px;font-size:12px;color:#000 !important;font-weight:600;">Tel: ${companyPhone}</div>` : ''}
          ${companyEmail ? `<div style="margin-top:2px;font-size:12px;color:#000 !important;font-weight:600;">Email: ${companyEmail}</div>` : ''}
          ${taxId ? `<div style="margin-top:2px;font-size:12px;color:#000 !important;font-weight:700;">VAT/TIN: ${taxId}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:32px;font-weight:900;color:#000 !important;text-transform:uppercase;border-bottom:2px solid #000;display:inline-block;padding-bottom:4px;margin-bottom:12px;">INVOICE</div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
            <span style="font-weight:700;color:#000;">INV NO:</span>
            <span style="font-weight:400;color:#000;">${sale.invoice_number || 'DRAFT'}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:4px;">
            <span style="font-weight:700;color:#000;">DATE:</span>
            <span style="font-weight:400;color:#000;">${invoiceDate}</span>
          </div>
        </div>
      </div>

      <!-- Distributor -->
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;font-weight:900;color:#fff !important;background:#000 !important;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:4px;margin-bottom:12px;display:inline-block;">Billed To</div>
        ${sale.customer ? `
        <div>
          <div style="font-size:16px;font-weight:900;color:#000;">${sale.customer.name}</div>
          ${sale.customer.phone ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:4px;">P: ${sale.customer.phone}</div>` : ''}
          ${sale.customer.email ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:2px;">E: ${sale.customer.email}</div>` : ''}
          ${sale.customer.address ? `<div style="margin-top:6px;font-size:12px;color:#000 !important;font-weight:500;max-width:300px;">${sale.customer.address}</div>` : ''}
        </div>` : '<div style="font-size:14px;font-weight:700;color:#666;">Walk-in / No Distributor Selected</div>'}
      </div>

      <!-- Items Table -->
      <div style="margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#000 !important;">
              <th style="padding:12px;text-align:left !important;font-size:10px;font-weight:900;color:#fff !important;text-transform:uppercase;width:5%;">#</th>
              <th style="padding:12px;text-align:left !important;font-size:10px;font-weight:900;color:#fff !important;text-transform:uppercase;width:45%;">Item Description</th>
              <th style="padding:12px;text-align:center !important;font-size:10px;font-weight:900;color:#fff !important;text-transform:uppercase;width:15%;">Qty</th>
              <th style="padding:12px;text-align:right !important;font-size:10px;font-weight:900;color:#fff !important;text-transform:uppercase;width:17.5%;">Unit Price</th>
              <th style="padding:12px;text-align:right !important;font-size:10px;font-weight:900;color:#fff !important;text-transform:uppercase;width:17.5%;">Total</th>
            </tr>
          </thead>
          <tbody style="border-bottom:2px solid #000;">
            ${(sale.items || sale.sale_items || []).map((item, idx) => `
              <tr>
                <td style="padding:12px;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;text-align:left;">${idx + 1}</td>
                <td style="padding:12px;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;text-align:left;">${item.product_name || item.product?.name || item.name || 'Item'}</td>
                <td style="padding:12px;text-align:center;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${Number(item.quantity)}</td>
                <td style="padding:12px;text-align:right;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="padding:12px;text-align:right;font-weight:400;font-size:12px;border-bottom:1px solid #e5e5e5;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals & QR -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:32px;">
        <div style="text-align:center;">
          <!-- <div style="border:2px solid #000;padding:8px;display:inline-block;margin-bottom:8px;">
            <img src="${qrUrl}" style="width:100px;height:100px;display:block;" />
          </div>
          <div style="font-size:10px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;max-width:140px;line-height:1.4;">Scan to Verify Authenticity</div> -->
        </div>
        
        <div style="flex:1;max-width:400px;">
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;">
              <span style="font-weight:700;">Subtotal</span>
              <span style="font-weight:700;">${parseFloat(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            ${parseFloat(sale.discount_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Discount</span><span style="font-weight:700;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
            ${parseFloat(sale.tax_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">VAT / Tax</span><span style="font-weight:700;">${parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
            ${parseFloat(sale.adjustment || 0) !== 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Adjustment</span><span style="font-weight:700;">${parseFloat(sale.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;background:#000 !important;padding:16px;margin-top:16px;margin-bottom:24px;border-radius:4px;">
            <span style="font-size:20px;font-weight:900;text-transform:uppercase;color:#fff !important;">Total Payable</span>
            <span style="font-size:20px;font-weight:900;color:#fff !important;">${parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div style="border:2px solid #000;padding:16px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:8px;">
              <span>Amount Paid (${sale.payments?.[0]?.payment_method || sale.payment_method || 'CASH'})</span>
              <span>${parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            ${parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) ? `
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;border-top:1px dashed #000;padding-top:8px;">
                <span>Change Due</span>
                <span>${(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:48px;padding-top:24px;">
        <div style="border-top:2px solid #000;display:flex;justify-content:space-between;align-items:flex-end;padding-top:24px;">
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
      </div>
      
      <div style="position:fixed;bottom:0;left:0;right:0;background:#fff;text-align:center;padding-top:16px;padding-bottom:16px;font-size:9px;font-weight:700;color:#666;text-transform:uppercase;width:100%;">
        Generated by Inzeedo ERP System &bull; 2026
      </div>
    </div>
  </div>`;

      const invoiceFilename = `Invoice-${sale.invoice_number || 'draft'}.pdf`;
      await generateAndSharePdf(html, invoiceFilename, true, actionType);
      return;
    }

    // ─── Thermal Receipt for Retail/Wholesale ────────────────────────────────
    const width = paperWidth === '58mm' ? '58mm' : '80mm';

    const receiptHtml = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @page { size: ${width} auto; margin: 0; }
          .invoice-body { 
            width: ${width}; 
            margin: 0; 
            padding: 8mm 4mm; 
            font-family: 'Inter', 'Courier New', Courier, monospace; 
            font-size: 11px; 
            line-height: 1.2;
            color: #000;
            background: #fff;
          }
          .invoice-body .center { text-align: center; }
          .invoice-body .right { text-align: right; }
          .invoice-body .bold { font-weight: bold; }
          .invoice-body .black { font-weight: 900; }
          .invoice-body .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .invoice-body .thick-divider { border-top: 2px solid #000; margin: 6px 0; }
          .invoice-body .row { display: flex; justify-content: space-between; margin: 1px 0; }
          .invoice-body .header { margin-bottom: 12px; }
          .invoice-body .footer { margin-top: 15px; font-size: 9px; }
          .invoice-body table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .invoice-body th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; font-size: 10px;  }
          .invoice-body td { padding: 6px 0; vertical-align: top; border-bottom: 1px dashed #000; }
          .invoice-body .item-name { font-weight: bold; font-size: 11px; }
          .invoice-body .item-variant { font-size: 9px; display: block; margin-top: 1px; }
          .invoice-body .grand-total { font-size: 14px; font-weight: 900; padding-top: 4px; margin-top: 4px; border-top: 2px solid #000; }
          .invoice-body .qr-container { margin: 15px 0; text-align: center; }
          .invoice-body .qr-image { width: 80px; height: 80px; }
          .invoice-body .sale-type { font-weight: bold; font-size: 10px; margin: 4px 0; border-bottom: 1px dashed #000; padding-bottom: 4px; padding-top: 4px; }
          @media print { .invoice-body { padding: 4mm; } .invoice-body .no-print { display: none; } }
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
          ${(sale.payments && sale.payments.length > 0) ? (() => {
        let totalPaid = 0;
        const pmtHtml = sale.payments.map(pmt => {
          const amt = parseFloat(String(pmt.amount || 0).replace(/,/g, '')) || 0;
          totalPaid += amt;
          return `<div class="row" style="font-size: 11px;"><span class="">${pmt.payment_method} PAID:</span><span class="bold">${amt.toLocaleString()}</span></div>`;
        }).join('');
        const payableAmt = parseFloat(String(sale.payable_amount || 0).replace(/,/g, '')) || 0;
        const changeHtml = totalPaid > payableAmt ? `<div class="row" style="font-weight: bold;"><span>CHANGE:</span><span>${(totalPaid - payableAmt).toLocaleString()}</span></div>` : '';
        return pmtHtml + changeHtml;
      })() : (() => {
        const paidAmt = parseFloat(String(sale.paid_amount || sale.payable_amount || 0).replace(/,/g, '')) || 0;
        const payableAmt = parseFloat(String(sale.payable_amount || 0).replace(/,/g, '')) || 0;
        const changeHtml = paidAmt > payableAmt ? `<div class="row" style="font-weight: bold;"><span>CHANGE:</span><span>${(paidAmt - payableAmt).toLocaleString()}</span></div>` : '';
        return `<div class="row" style="font-size: 11px;"><span class="">${sale.payment_method || 'CASH'} PAID:</span><span class="bold">${paidAmt.toLocaleString()}</span></div>` + changeHtml;
      })()}
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
    await generateAndSharePdf(receiptHtml, receiptFilename, false, actionType);
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

    if (paperWidth === 'A4') {
      const items = (sale.items || sale.sale_items || []);
      const companyAddress = sale.branch?.address || businessAddress || user?.organization?.address || '';
      const companyPhone = sale.branch?.phone || user?.organization?.phone || businessPhone || '';
      const companyEmail = sale.branch?.email || user?.organization?.email || businessEmail || '';
      const invoiceDate = new Date(sale.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const itemRows = items.map((item, idx) =>
        `<tr>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-weight:400;font-size:12px;text-align:left;">${idx + 1}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-weight:400;font-size:12px;text-align:left;">${item.product_name || item.product?.name || item.name || 'Item'}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:center;font-weight:400;font-size:12px;">${Number(item.quantity)}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:400;font-size:12px;">${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:400;font-size:12px;">${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>`
      ).join('');

      htmlContent = `
<style>
  :root { color-scheme: light only; }
  @page { size: A4; margin: 8mm; }
  .invoice-body * { box-sizing: border-box; margin: 0; padding: 0; color: #000 !important; }
  .invoice-body { font-family: system-ui, Helvetica, Arial, sans-serif; font-size: 12px; color: #000; background: #fff; line-height: 1.5; padding: 0; max-width: 800px; margin: 0 auto; min-height: 270mm; display: flex; flex-direction: column; }
  .invoice-body table { width: 100%; border-collapse: collapse; }
  .invoice-body th { padding: 12px; font-size: 10px; font-weight: 900; border-bottom: 2px solid #000; text-align: left; text-transform: uppercase; }
  .invoice-body td { padding: 12px; font-weight: 400; border-bottom: 1px solid #e5e5e5; }
  @media print { .invoice-body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
<div class="invoice-body">

<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #000;margin-bottom:24px;">
  <div>
    ${businessLogo ? `<img src="${businessLogo}" style="height:48px;object-fit:contain;margin-bottom:12px;display:block;filter:grayscale(100%);" />` : ''}
    <div style="font-size:24px;font-weight:900;color:#000;letter-spacing:-0.5px;text-transform:uppercase;">${businessName || 'Inzeedo Manufacturing'}</div>
    ${companyAddress ? `<div style="margin-top:8px;font-size:12px;color:#000 !important;font-weight:500;">${companyAddress}</div>` : ''}
    ${companyPhone ? `<div style="margin-top:4px;font-size:12px;color:#000 !important;font-weight:600;">Tel: ${companyPhone}</div>` : ''}
    ${companyEmail ? `<div style="margin-top:2px;font-size:12px;color:#000 !important;font-weight:600;">Email: ${companyEmail}</div>` : ''}
    ${taxId ? `<div style="margin-top:2px;font-size:12px;color:#000 !important;font-weight:700;">VAT/TIN: ${taxId}</div>` : ''}
  </div>
  <div style="text-align:right;">
    <div style="font-size:32px;font-weight:900;color:#000;text-transform:uppercase;border-bottom:2px solid #000;display:inline-block;padding-bottom:4px;margin-bottom:12px;">INVOICE</div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
      <span style="font-weight:700;color:#000;">INV NO:</span>
      <span style="font-weight:400;color:#000;">${sale.invoice_number || 'DRAFT'}</span>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:4px;">
      <span style="font-weight:700;color:#000;">DATE:</span>
      <span style="font-weight:400;color:#000;">${invoiceDate}</span>
    </div>
  </div>
</div>

<div style="margin-bottom:24px;">
  <div style="font-size:10px;font-weight:900;color:#fff !important;background:#000 !important;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:4px;margin-bottom:12px;display:inline-block;">Billed To</div>
  ${(() => {
          const dist = sale.distributor || sale.customer; return dist ? `
  <div>
    <div style="font-size:16px;font-weight:900;color:#000;">${dist.name || ''}</div>
    ${dist.phone ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:4px;">P: ${dist.phone}</div>` : ''}
    ${dist.email ? `<div style="font-size:12px;font-weight:700;color:#000;margin-top:2px;">E: ${dist.email}</div>` : ''}
    ${dist.address ? `<div style="margin-top:6px;font-size:12px;color:#000 !important;font-weight:500;max-width:300px;">${dist.address}</div>` : ''}
  </div>` : '<div style="font-size:14px;font-weight:700;color:#000;">Walk-in / No Distributor Selected</div>';
        })()}
</div>

<div style="margin-bottom:24px;">
  <table>
    <thead>
      <tr style="background:#000 !important;">
        <th style="padding:12px;width:5%;text-align:left !important;color:#fff !important;">#</th>
        <th style="padding:12px;width:45%;text-align:left !important;color:#fff !important;">Item Description</th>
        <th style="padding:12px;width:15%;text-align:center !important;color:#fff !important;">Qty</th>
        <th style="padding:12px;width:17.5%;text-align:right !important;color:#fff !important;">Unit Price</th>
        <th style="padding:12px;width:17.5%;text-align:right !important;color:#fff !important;">Total</th>
      </tr>
    </thead>
    <tbody style="border-bottom:2px solid #000;">
      ${itemRows}
    </tbody>
  </table>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:32px;">
  <div style="text-align:center;">
    <!-- <div style="border:2px solid #000;padding:8px;display:inline-block;margin-bottom:8px;">
      <img src="${qrUrl}" style="width:100px;height:100px;display:block;" />
    </div>
    <div style="font-size:10px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;max-width:140px;line-height:1.4;">Scan to Verify Authenticity</div> -->
  </div>
  
  <div style="flex:1;max-width:400px;">
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;">
        <span style="font-weight:700;">Subtotal</span>
        <span style="font-weight:700;">${parseFloat(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      ${parseFloat(sale.discount_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">Discount</span><span style="font-weight:700;">- ${parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
      ${parseFloat(sale.tax_amount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#000;"><span style="font-weight:700;">VAT / Tax</span><span style="font-weight:700;">${parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
    </div>
    
    <div style="display:flex;justify-content:space-between;align-items:center;background:#000 !important;padding:16px;margin-top:16px;margin-bottom:24px;border-radius:4px;">
      <span style="font-size:20px;font-weight:900;text-transform:uppercase;color:#fff !important;">Total Payable</span>
      <span style="font-size:20px;font-weight:900;color:#fff !important;">${parseFloat(sale.payable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  </div>
</div>

<div style="margin-top:48px;padding-top:24px;">
  <div style="border-top:2px solid #000;display:flex;justify-content:space-between;align-items:flex-end;padding-top:24px;">
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
</div>
  
<div style="position:fixed;bottom:0;left:0;right:0;background:#fff;text-align:center;padding-top:16px;padding-bottom:16px;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;width:100%;">
  Generated by Inzeedo ERP System &bull; 2026
</div>
</div>`;
    } else {
      const width = paperWidth === '58mm' ? '58mm' : '80mm';
      htmlContent = `
<style>
  :root { color-scheme: light only; }
  @page{size:${width} auto;margin:0}
  .invoice-body * { color: #000 !important; }
  .invoice-body{width:${width};margin:0;padding:6mm 4mm;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.3;color:#000;background:#fff}
  .invoice-body .c{text-align:center} .invoice-body .r{text-align:right} .invoice-body .b{font-weight:bold}
  .invoice-body .d{border-top:1px dashed #000;margin:4px 0}
  .invoice-body .row{display:flex;justify-content:space-between;margin:2px 0}
  .invoice-body table{width:100%;border-collapse:collapse}
  .invoice-body th{text-align:left;border-bottom:1px solid #000;padding:3px 0;font-size:10px}
  .invoice-body td{padding:4px 0;border-bottom:1px dashed #000;vertical-align:top}
  .invoice-body .tot{font-size:13px;font-weight:900;border-top:2px solid #000;padding-top:4px;margin-top:3px;display:flex;justify-content:space-between}
</style>
<div class="invoice-body">
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
</div>`;
    }

    // For Capacitor native platform, we can't reliably use window.print() inside a hidden iframe.
    // Instead, we use our generateAndSharePdf which natively opens a Share / Print sheet!
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const lanSuccess = await printViaLan(sale, t);
        if (lanSuccess) return;

        const receiptFilename = `Receipt-${sale.invoice_number || 'draft'}.pdf`;
        await generateAndSharePdf(htmlContent, receiptFilename, isManufacturing, 'share');
        return;
      }
    } catch (e) {
      console.warn('[receiptService] Capacitor check failed, falling back to iframe print.', e);
    }

    // Inject a hidden iframe and trigger the OS native print dialog for Web.
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
