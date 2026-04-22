"use client";

/**
 * Receipt Service
 * Handles formatting and printing of professional thermal receipts.
 */

export const receiptService = {
  /**
   * Generates a thermal receipt layout and triggers the print dialog.
   */
  print: async (sale) => {
    if (!sale) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; 
            margin: 0; 
            padding: 10mm 5mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            line-height: 1.4;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; }
          .header { margin-bottom: 10px; }
          .footer { margin-top: 20px; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 1px solid #000; }
          .item-name { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 16px;">${sale.branch?.organization?.name || 'Inzeedo POS'}</div>
          <div>${sale.branch?.name || 'Main Warehouse'}</div>
          <div>${sale.branch?.address || ''}</div>
          <div>Tel: ${sale.branch?.phone || ''}</div>
        </div>

        <div class="divider"></div>
        
        <div class="row">
          <span>Date:</span>
          <span>${new Date(sale.created_at).toLocaleString()}</span>
        </div>
        <div class="row">
          <span>Invoice:</span>
          <span class="bold">${sale.invoice_number}</span>
        </div>
        <div class="row">
          <span>Cashier:</span>
          <span>${sale.cashier?.name || 'Staff'}</span>
        </div>
        <div class="row">
          <span>Customer:</span>
          <span>${sale.customer?.name || 'Walk-in Guest'}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td colspan="3" class="item-name">${item.product?.name} ${item.variant?.name ? '(' + item.variant.name + ')' : ''}</td>
              </tr>
              <tr>
                <td>@ ${Math.round(item.unit_price).toLocaleString()}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${Math.round(item.total_amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="row">
          <span>Subtotal:</span>
          <span>LKR ${Math.round(sale.total_amount).toLocaleString()}</span>
        </div>
        <div class="row">
          <span>Discount:</span>
          <span>-LKR ${Math.round(sale.discount_amount).toLocaleString()}</span>
        </div>
        <div class="row">
          <span>Tax:</span>
          <span>LKR ${Math.round(sale.tax_amount).toLocaleString()}</span>
        </div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 14px;">
          <span>TOTAL:</span>
          <span>LKR ${Math.round(sale.payable_amount).toLocaleString()}</span>
        </div>

        <div class="divider"></div>
        <div class="row">
          <span>Method:</span>
          <span class="uppercase">${sale.payment_method}</span>
        </div>
        <div class="row">
          <span>Paid:</span>
          <span>LKR ${Math.round(sale.paid_amount).toLocaleString()}</span>
        </div>

        <div class="footer center">
          <div>Thank you for your business!</div>
          <div class="bold">Powered by Inzeedo</div>
          <br/>
          <div>*** Duplicate Receipt ***</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  }
};
