"use client";

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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${sale.invoice_number}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body { 
            width: 80mm; 
            margin: 0; 
            padding: 10mm 4mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 13px; 
            line-height: 1.2;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .header { margin-bottom: 15px; }
          .footer { margin-top: 25px; font-size: 11px; }
          
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-size: 11px; }
          td { padding: 5px 0; vertical-align: top; }
          
          .item-row-main { font-weight: bold; font-size: 13px; }
          .item-row-sub { font-size: 11px; opacity: 0.8; }
          
          .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
          .qr-container { margin: 20px 0; text-align: center; }
          .qr-image { width: 100px; height: 100px; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 18px; margin-bottom: 4px;">${sale.branch?.organization?.name || 'INZEEDO POS'}</div>
          <div class="bold uppercase">${sale.branch?.name || 'Main Warehouse'}</div>
          <div>${sale.branch?.address || ''}</div>
          <div>TEL: ${sale.branch?.phone || ''}</div>
        </div>

        <div class="divider"></div>
        
        <div class="row">
          <span>INVOICE:</span>
          <span class="bold">${sale.invoice_number}</span>
        </div>
        <div class="row">
          <span>DATE:</span>
          <span>${formatDate(sale.created_at)}</span>
        </div>
        <div class="row">
          <span>CASHIER:</span>
          <span>${sale.cashier?.name || 'Staff'}</span>
        </div>
        <div class="row">
          <span>CUSTOMER:</span>
          <span class="bold">${sale.customer?.name || 'Walk-in Guest'}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">ITEM</th>
              <th class="right" style="width: 15%;">QTY</th>
              <th class="right" style="width: 35%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td colspan="3">
                  <div class="item-row-main">${item.product?.name || item.name}</div>
                  <div class="item-row-sub">${item.variant?.name || 'Standard'} @ ${Math.round(item.unit_price).toLocaleString()}</div>
                </td>
              </tr>
              <tr style="border-bottom: 1px dotted #ccc;">
                <td></td>
                <td class="right">${item.quantity}</td>
                <td class="right bold">${Math.round(item.total_amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="row">
          <span>SUB TOTAL:</span>
          <span>${Math.round(sale.total_amount).toLocaleString()}</span>
        </div>
        ${sale.discount_amount > 0 ? `
          <div class="row">
            <span>SAVINGS (DISC):</span>
            <span>- ${Math.round(sale.discount_amount).toLocaleString()}</span>
          </div>
        ` : ''}
        ${sale.tax_amount > 0 ? `
          <div class="row">
            <span>TAX:</span>
            <span>${Math.round(sale.tax_amount).toLocaleString()}</span>
          </div>
        ` : ''}
        ${sale.adjustment !== 0 ? `
          <div class="row">
            <span>ADJUSTMENT:</span>
            <span>${Math.round(sale.adjustment).toLocaleString()}</span>
          </div>
        ` : ''}
        
        <div class="double-divider"></div>
        
        <div class="row total-row">
          <span>GRAND TOTAL:</span>
          <span>LKR ${Math.round(sale.payable_amount).toLocaleString()}</span>
        </div>

        <div class="divider"></div>
        
        <div class="row bold">
          <span class="uppercase">${sale.payment_method || 'CASH'} PAID:</span>
          <span>LKR ${(parseFloat(sale.paid_amount) || sale.payable_amount).toLocaleString()}</span>
        </div>
        ${(parseFloat(sale.paid_amount) > sale.payable_amount) ? `
          <div class="row">
            <span>CHANGE:</span>
            <span>LKR ${(parseFloat(sale.paid_amount) - sale.payable_amount).toLocaleString()}</span>
          </div>
        ` : ''}

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="Verification QR" />
          <div style="font-size: 8px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6;">Scan for digital verification</div>
        </div>

        <div class="footer center">
          <div class="bold italic">"Thank you for your business!"</div>
          <div style="margin-top: 10px;">
            <div class="bold">Powered by INZEEDO</div>
            <div style="font-size: 9px; opacity: 0.5;">A Premium Enterprise Solution</div>
          </div>
          <br/>
          <div style="font-size: 10px; border: 1px solid #000; padding: 2px;">*** CUSTOMER COPY ***</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
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
