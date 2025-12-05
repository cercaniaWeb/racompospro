import { TicketConfig } from '@/store/settingsStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PrintTicketParams {
  sale: any;
  items: any[];
  config: TicketConfig;
  user?: { name: string };
}

export const generateTicketHtml = ({ sale, items, config, user }: PrintTicketParams) => {
  const dateStr = format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: es });

  return `
    <div id="ticket-content" style="font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; background: white; color: black; font-size: 12px; line-height: 1.2;">
      <style>
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .mb-2 { margin-bottom: 8px; }
        .border-b { border-bottom: 1px dashed black; padding-bottom: 5px; margin-bottom: 5px; }
        .border-t { border-top: 1px dashed black; padding-top: 5px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; vertical-align: top; }
        td.price { text-align: right; }
        .logo { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .header-text { white-space: pre-wrap; margin-bottom: 10px; }
        .footer-text { white-space: pre-wrap; margin-top: 10px; font-size: 10px; }
      </style>

      <div class="text-center">
        ${config.showLogo ? (config.logoUrl ? `<img src="${config.logoUrl}" style="max-width: 60mm; max-height: 30mm; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto;" />` : '<div class="logo">Racom-POS</div>') : ''}
        <div class="header-text">${config.headerText}</div>
      </div>

      <div class="mb-2">
        ${config.showDate ? `<div>Fecha: ${dateStr}</div>` : ''}
        <div>Ticket: #${sale.transaction_id.slice(-8)}</div>
        ${config.showCashier && user ? `<div>Cajero: ${user.name}</div>` : ''}
      </div>

      <div class="border-b"></div>

      <table>
        <thead>
          <tr>
            <th style="width: 15%">Cant</th>
            <th style="width: 55%">Desc</th>
            <th style="width: 30%" class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.quantity}</td>
              <td>${item.product_name}</td>
              <td class="price">$${item.total_price.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="border-t">
        <div class="flex justify-between" style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>$${sale.net_amount.toFixed(2)}</span>
        </div>
        ${sale.discount_amount > 0 ? `
          <div class="flex justify-between" style="display: flex; justify-content: space-between;">
            <span>Descuento:</span>
            <span>-$${sale.discount_amount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between font-bold" style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;">
          <span>TOTAL:</span>
          <span>$${sale.total_amount.toFixed(2)}</span>
        </div>
        <div class="flex justify-between" style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
          <span>Pago (${sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}):</span>
          <span>$${sale.total_amount.toFixed(2)}</span>
        </div>
      </div>

      ${sale.notes ? `
        <div class="border-t" style="margin-top: 10px; padding-top: 5px;">
          <div style="font-size: 10px; font-style: italic;">
            <strong>Nota:</strong> ${sale.notes}
          </div>
        </div>
      ` : ''}

      <div class="text-center footer-text">
        ${config.footerText}
      </div>
      
      <div class="text-center" style="margin-top: 15px;">
        *** GRACIAS POR SU COMPRA ***
      </div>
    </div>
  `;
};

// Deprecated: Use TicketPreviewModal instead
export const printTicket = (params: PrintTicketParams) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para imprimir el ticket');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket #${params.sale.transaction_id}</title>
    </head>
    <body style="margin: 0; padding: 0; display: flex; justify-content: center;">
      ${generateTicketHtml(params)}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
