
const fs = require('fs');
const file = 'd:/Projects/ERP/Mobile App/services/receipt.js';
let content = fs.readFileSync(file, 'utf8');

// Close the print method properly with a comma and add printDirect after
const closing = `    const receiptFilename = \`Receipt-\${sale.invoice_number || 'draft'}.pdf\`;
    await generateAndSharePdf(receiptHtml, receiptFilename, false);
  }
};`;

const replacement = `    const receiptFilename = \`Receipt-\${sale.invoice_number || 'draft'}.pdf\`;
    await generateAndSharePdf(receiptHtml, receiptFilename, false);
  },

  /**
   * printDirect: Opens the OS native print dialog (Android PrintManager / iOS AirPrint).
   * This allows printing to any paired Bluetooth or USB printer automatically.
   */
  printDirect: async (sale, t) => {
    if (!sale) return;

    const {
      businessLogo, businessName, taxId,
      footerText, refundPolicy, paperWidth,
      businessPhone, businessAddress
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
    const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=\${encodeURIComponent(qrData)}\`;

    let htmlContent;

    if (isManufacturing) {
      const items = (sale.items || sale.sale_items || []);
      const companyAddress = sale.branch?.address || businessAddress || user?.organization?.address || '';
      const companyPhone = sale.branch?.phone || user?.organization?.phone || businessPhone || '';
      const invoiceDate = new Date(sale.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const itemRows = items.map((item, idx) =>
        \`<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:11px;">\${idx + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:12px;font-weight:600;">\${item.product_name || item.product?.name || item.name || 'Item'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;font-size:11px;">\${item.variant?.name || item.product_variant?.name || item.variant_name || '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;text-align:center;font-weight:700;">\${Number(item.quantity)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;text-align:right;">\${parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #ddd;text-align:right;font-weight:700;">\${parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        </tr>\`
      ).join('');

      htmlContent = \`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice \${sale.invoice_number || 'DRAFT'}</title>
<style>
  @page{size:A4;margin:10mm}*{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,Helvetica,Arial,sans-serif;font-size:12px;color:#000;background:#fff}
  table{width:100%;border-collapse:collapse}
  th{padding:9px 10px;font-size:10px;font-weight:700;border-bottom:1.5px solid #000;text-align:left}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div style="display:flex;justify-content:space-between;border-bottom:1.5px solid #000;padding-bottom:14px;margin-bottom:14px;">
  <div>
    \${businessLogo ? \`<img src="\${businessLogo}" style="height:44px;object-fit:contain;margin-bottom:8px;display:block;"/>\` : ''}
    <div style="font-size:18px;font-weight:800;">\${businessName || 'Inzeedo'}</div>
    \${companyAddress ? \`<div style="font-size:11px;color:#555;margin-top:3px;">\${companyAddress}</div>\` : ''}
    \${companyPhone ? \`<div style="font-size:11px;color:#555;">Tel: \${companyPhone}</div>\` : ''}
    \${taxId ? \`<div style="font-size:11px;color:#555;">VAT/TIN: \${taxId}</div>\` : ''}
  </div>
  <div style="text-align:right;">
    <div style="font-size:22px;font-weight:900;">Invoice</div>
    <div style="margin-top:8px;font-size:14px;font-weight:700;">\${sale.invoice_number || 'DRAFT'}</div>
    <div style="font-size:11px;color:#555;margin-top:3px;">\${invoiceDate}</div>
  </div>
</div>
<table style="margin-bottom:14px;border:1px solid #ccc;">
  <thead><tr style="background:#f5f5f5;">
    <th style="width:5%;">#</th><th style="width:35%;">Item Description</th><th style="width:15%;">Pack/Size</th>
    <th style="width:10%;text-align:center;">Qty</th><th style="width:17.5%;text-align:right;">Unit Price</th><th style="width:17.5%;text-align:right;">Amount</th>
  </tr></thead>
  <tbody>\${itemRows}</tbody>
</table>
<div style="display:flex;justify-content:flex-end;">
  <div style="width:250px;border:1px solid #ccc;padding:12px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Subtotal</span><span>\${parseFloat(sale.total_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
    \${parseFloat(sale.discount_amount)>0?\`<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Discount</span><span>- \${parseFloat(sale.discount_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>\`:''}
    \${parseFloat(sale.tax_amount)>0?\`<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Tax</span><span>\${parseFloat(sale.tax_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>\`:''}
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;border-top:1.5px solid #000;padding-top:9px;margin-top:7px;"><span>Total</span><span>\${parseFloat(sale.payable_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
  </div>
</div>
<div style="margin-top:36px;border-top:1px solid #000;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div>
    \${refundPolicy?\`<div style="font-size:10px;color:#555;"><strong>Terms:</strong> \${refundPolicy}</div>\`:''}
    \${footerText?\`<div style="font-size:10px;color:#555;margin-top:3px;">\${footerText}</div>\`:'<div style="font-size:11px;font-weight:600;">Thank you for your business!</div>'}
    <div style="margin-top:18px;"><div style="width:160px;border-bottom:1px solid #000;height:36px;"></div><div style="font-size:9px;margin-top:3px;font-weight:700;">Authorized Signature</div></div>
  </div>
  <div style="font-size:9px;color:#999;">Generated by Inzeedo ERP System &bull; 2026</div>
</div>
</body></html>\`;
    } else {
      const width = paperWidth === '58mm' ? '58mm' : '80mm';
      htmlContent = \`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt \${sale.invoice_number}</title>
<style>
  @page{size:\${width} auto;margin:0}
  body{width:\${width};margin:0;padding:6mm 4mm;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.3;color:#000;background:#fff}
  .c{text-align:center}.r{text-align:right}.b{font-weight:bold}
  .d{border-top:1px dashed #000;margin:4px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;border-bottom:1px solid #000;padding:3px 0;font-size:10px}
  td{padding:4px 0;border-bottom:1px dashed #ccc;vertical-align:top}
  .tot{font-size:13px;font-weight:900;border-top:2px solid #000;padding-top:4px;margin-top:3px;display:flex;justify-content:space-between}
  @media print{body{padding:4mm}}
</style></head><body>
<div class="c b" style="font-size:16px;">\${businessName || 'Inzeedo POS'}</div>
\${businessAddress?\`<div class="c" style="font-size:10px;">\${businessAddress}</div>\`:''}
\${businessPhone?\`<div class="c" style="font-size:10px;">Tel: \${businessPhone}</div>\`:''}
<div class="d"></div>
<div class="row"><span>Invoice:</span><span class="b">\${sale.invoice_number||'DRAFT'}</span></div>
<div class="row"><span>Date:</span><span>\${formatDate(sale.created_at)}</span></div>
<div class="d"></div>
<table><thead><tr><th style="width:50%;">Item</th><th class="r" style="width:25%;">Price</th><th class="r" style="width:25%;">Amt</th></tr></thead>
<tbody>\${(sale.items||sale.sale_items||[]).map(item=>\`<tr>
  <td>\${Number(item.quantity)} x \${item.product_name||item.product?.name||item.name||'Item'}</td>
  <td class="r">\${parseFloat(item.unit_price||item.price||0).toLocaleString()}</td>
  <td class="r b">\${parseFloat((item.unit_price||item.price||0)*item.quantity).toLocaleString()}</td>
</tr>\`).join('')}</tbody></table>
<div class="row" style="margin-top:5px;"><span>Subtotal:</span><span>\${parseFloat(sale.total_amount||0).toLocaleString()}</span></div>
\${parseFloat(sale.discount_amount)>0?\`<div class="row"><span>Discount:</span><span>- \${parseFloat(sale.discount_amount).toLocaleString()}</span></div>\`:''}
\${parseFloat(sale.tax_amount)>0?\`<div class="row"><span>Tax:</span><span>\${parseFloat(sale.tax_amount).toLocaleString()}</span></div>\`:''}
<div class="tot"><span>TOTAL:</span><span>\${parseFloat(sale.payable_amount||0).toLocaleString()}</span></div>
<div class="d"></div>
\${(sale.payments&&sale.payments.length>0?sale.payments:[{payment_method:sale.payment_method||'Cash',amount:sale.paid_amount||sale.payable_amount}]).map(p=>\`<div class="row"><span>\${p.payment_method} Paid:</span><span class="b">\${parseFloat(p.amount).toLocaleString()}</span></div>\`).join('')}
\${refundPolicy?\`<div class="c" style="margin-top:10px;font-size:9px;">\${refundPolicy}</div>\`:''}
<div class="c b" style="margin-top:7px;font-size:10px;">\${footerText||'Thank you!'}</div>
<img src="\${qrUrl}" style="width:70px;height:70px;display:block;margin:10px auto 0;"/>
</body></html>\`;
    }

    // Inject a hidden iframe and trigger the OS native print dialog.
    // On Android Capacitor WebView this invokes Android PrintManager
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
`;

content = content.replace(closing, replacement);
fs.writeFileSync(file, content);
console.log('printDirect method added successfully.');
