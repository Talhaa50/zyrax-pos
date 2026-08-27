import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

function fmt(amount, currency) {
  return formatCurrency(amount, currency);
}

// ── Standalone HTML Generator for A4 Full Page Invoice ─────────────
function getA4InvoiceHtml(sale, items, settings) {
  const currency = settings?.currency || 'PKR';
  const businessName = settings?.business_name || 'MTC Decoration';
  const footer = settings?.receipt_footer || 'Thank you for shopping with us!';

  const now = new Date(sale.created_at || Date.now());
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const discountVal = Number(sale.discount_amount || 0);
  const taxVal = Number(sale.tax_amount || 0);
  const taxRate = Number(sale.tax_rate || 0);

  const rows = items
    .map(
      (item, idx) => `
    <tr style="background: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
      <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 700; color: #111827; font-size: 13px;">${item.product_name || item.name}</div>
        ${item.barcode ? `<div style="font-size: 10px; color: #6b7280;">Barcode: ${item.barcode}</div>` : ''}
      </td>
      <td style="padding: 10px 14px; text-align: center; font-weight: 600; color: #374151; font-size: 13px; border-bottom: 1px solid #e5e7eb;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 14px; text-align: right; font-family: monospace; color: #374151; font-size: 13px; border-bottom: 1px solid #e5e7eb;">
        ${currency} ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-weight: 700; color: #111827; font-size: 13px; border-bottom: 1px solid #e5e7eb;">
        ${currency} ${Number(item.subtotal || item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${sale.invoice_number}</title>
      <style>
        @page {
          margin: 10mm 12mm;
          size: A4 portrait;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          line-height: 1.4;
        }
        .sheet {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <!-- Top Green Accent Header -->
        <div style="background: #ffffff; position: relative; border-bottom: 2px solid #10b981;">
          <div style="height: 6px; width: 100%; background: linear-gradient(90deg, #059669, #10b981, #84cc16);"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 28px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 46px; height: 46px; background: #059669; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 22px; font-weight: 800;">
                M
              </div>
              <div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">${businessName}</h1>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280; font-weight: 500;">Retail & Point of Sale</p>
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #4b5563; line-height: 1.5;">
              <div style="font-weight: 700; color: #111827;">Support & Inquiries</div>
              <div>support@retailerpos.com</div>
              <div>Official Store Counter</div>
              <div>+92 (300) 123-4567</div>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div style="text-align: center; padding: 14px 28px; background: #fafafa; border-bottom: 1px solid #f3f4f6;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #111827; text-transform: uppercase;">INVOICE</h2>
        </div>

        <!-- Metadata Box -->
        <div style="padding: 18px 28px;">
          <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 12px;">
            <div style="min-width: 220px; line-height: 1.8;">
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Invoice Date:</strong> <span style="font-weight: 600; color: #111827;">${dateStr} (${timeStr})</span></div>
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Invoice Number:</strong> <span style="font-family: monospace; font-weight: 700; color: #059669;">${sale.invoice_number}</span></div>
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Payment Status:</strong> <span style="display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">✓ PAID FULL</span></div>
            </div>
            <div style="min-width: 220px; line-height: 1.8;">
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Customer:</strong> <span style="font-weight: 600; color: #111827;">${sale.customer_name || 'Walk-in Customer'}</span></div>
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Cashier:</strong> <span style="font-weight: 600; color: #111827;">${sale.cashier_name || 'Counter Staff'}</span></div>
              <div><strong style="color: #4b5563; width: 110px; display: inline-block;">Payment Method:</strong> <span style="font-weight: 700; color: #111827; text-transform: uppercase;">${sale.payment_method || 'Cash'}</span></div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 0 28px 10px 28px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #374151; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #374151; text-align: center; letter-spacing: 0.5px;">Quantity</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #374151; text-align: right; letter-spacing: 0.5px;">Unit Price</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #374151; text-align: right; letter-spacing: 0.5px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <!-- Totals Box -->
        <div style="padding: 10px 28px 20px 28px; display: flex; justify-content: flex-end;">
          <div style="width: 280px; font-size: 12px; line-height: 2;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding: 2px 0;">
              <span style="color: #4b5563; font-weight: 600;">Subtotal:</span>
              <span style="font-family: monospace; font-weight: 600;">${currency} ${Number(sale.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${
              discountVal > 0
                ? `
              <div style="display: flex; justify-content: space-between; color: #059669; font-weight: 700; border-bottom: 1px solid #f3f4f6; padding: 2px 0;">
                <span>Discount:</span>
                <span style="font-family: monospace;">- ${currency} ${Number(discountVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            `
                : ''
            }
            ${
              taxVal > 0
                ? `
              <div style="display: flex; justify-content: space-between; color: #4b5563; border-bottom: 1px solid #f3f4f6; padding: 2px 0;">
                <span>Tax (${taxRate}%):</span>
                <span style="font-family: monospace;">${currency} ${Number(taxVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            `
                : ''
            }
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #111827; background: #f9fafb; padding: 6px 8px; margin-top: 6px; font-size: 14px; font-weight: 900;">
              <span>Total Amount Due:</span>
              <span style="font-family: monospace; color: #047857;">${currency} ${Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Footer / Terms -->
        <div style="border-top: 1px dashed #e5e7eb; background: #fafafa; padding: 16px 28px; font-size: 11px; color: #6b7280; line-height: 1.5;">
          <div style="font-weight: 700; color: #374151; text-transform: uppercase; margin-bottom: 4px;">Terms & Conditions:</div>
          <div>${footer} Please retain this invoice for proof of purchase and warranty. Returns/exchanges within 7 days.</div>
          <div style="margin-top: 10px; border-top: 1px solid #f3f4f6; padding-top: 8px; text-align: center; color: #9ca3af; font-size: 10px;">
            For questions or support, contact <strong>${businessName}</strong> — Invoice #${sale.invoice_number}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ── Standalone HTML Generator for 80mm Thermal Slip ───────────────
function getThermalReceiptHtml(sale, items, settings) {
  const currency = settings?.currency || 'PKR';
  const businessName = settings?.business_name || 'MTC Decoration';
  const footer = settings?.receipt_footer || 'Thank you for shopping with us!';

  const now = new Date(sale.created_at || Date.now());
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const discountVal = Number(sale.discount_amount || 0);
  const taxVal = Number(sale.tax_amount || 0);
  const taxRate = Number(sale.tax_rate || 0);

  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 3px 0; text-align: left; vertical-align: top;">
        <div style="font-weight: bold; line-height: 1.2;">${item.product_name || item.name}</div>
        <div style="font-size: 10px; color: #444;">${currency} ${Number(item.price).toFixed(2)} x ${item.quantity}</div>
      </td>
      <td style="padding: 3px 0; text-align: center; vertical-align: top; font-weight: bold;">
        ${item.quantity}
      </td>
      <td style="padding: 3px 0; text-align: right; vertical-align: top; font-weight: bold; font-family: monospace;">
        ${currency} ${Number(item.subtotal || item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Receipt - ${sale.invoice_number}</title>
      <style>
        @page {
          margin: 0;
          size: 80mm auto;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 4mm 3mm;
          width: 74mm;
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.35;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .dashed { border-top: 1px dashed #000; margin: 6px 0; }
        .double { border-top: 2px solid #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; align-items: baseline; }
      </style>
    </head>
    <body>
      <div class="center">
        <div style="font-size: 17px; font-weight: 900; text-transform: uppercase; font-family: sans-serif;">${businessName}</div>
        <div style="font-size: 11px; font-weight: bold; color: #333;">Retail & Point of Sale</div>
        <div style="font-size: 10px; color: #555;">Phone: +92 (300) 123-4567</div>
        <div class="dashed"></div>
      </div>

      <div style="font-size: 12px; line-height: 1.4;">
        <div class="row"><span style="font-weight: bold;">Invoice #:</span> <span style="font-family: monospace; font-weight: bold;">${sale.invoice_number}</span></div>
        <div class="row"><span>Date:</span> <span>${dateStr} ${timeStr}</span></div>
        <div class="row"><span>Cashier:</span> <span>${sale.cashier_name || 'Counter Staff'}</span></div>
        ${sale.customer_name ? `<div class="row"><span style="font-weight: bold;">Customer:</span> <span style="font-weight: bold;">${sale.customer_name}</span></div>` : ''}
        <div class="row"><span>Payment:</span> <span style="font-weight: bold; text-transform: uppercase;">${sale.payment_method || 'CASH'}</span></div>
      </div>

      <div class="dashed"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 1px dashed #000; font-size: 10px; text-transform: uppercase; font-weight: bold;">
            <th style="text-align: left; padding-bottom: 3px;">Item</th>
            <th style="text-align: center; padding-bottom: 3px;">Qty</th>
            <th style="text-align: right; padding-bottom: 3px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="dashed"></div>

      <div style="font-size: 12px; line-height: 1.5;">
        <div class="row"><span>Subtotal:</span> <span style="font-family: monospace;">${currency} ${Number(sale.subtotal).toFixed(2)}</span></div>
        ${discountVal > 0 ? `<div class="row" style="font-weight: bold;"><span>Discount:</span> <span style="font-family: monospace;">- ${currency} ${Number(discountVal).toFixed(2)}</span></div>` : ''}
        ${taxVal > 0 ? `<div class="row"><span>Tax (${taxRate}%):</span> <span style="font-family: monospace;">${currency} ${Number(taxVal).toFixed(2)}</span></div>` : ''}
        <div class="double" style="padding-top: 4px;">
          <div class="row" style="font-size: 15px; font-weight: 900;">
            <span>TOTAL:</span>
            <span style="font-family: monospace;">${currency} ${Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="dashed"></div>

      <div class="center" style="font-size: 10px; line-height: 1.4;">
        <div style="font-weight: bold;">${footer}</div>
        <div style="color: #555;">Goods once sold will not be returned without bill</div>
        <div style="margin-top: 6px; color: #888; font-family: monospace;">*** Zyrax POS ***</div>
      </div>
    </body>
    </html>
  `;
}

export default function ReceiptModal({ open, onClose, sale, items = [], settings }) {
  if (!sale) return null;

  const [viewMode, setViewMode] = useState('a4');

  const currency = settings?.currency || 'PKR';
  const businessName = settings?.business_name || 'MTC Decoration';
  const footer = settings?.receipt_footer || 'Thank you for shopping with us!';

  const now = new Date(sale.created_at || Date.now());
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const discountVal = Number(sale.discount_amount || 0);
  const taxVal = Number(sale.tax_amount || 0);
  const taxRate = Number(sale.tax_rate || 0);

  // ── Trigger A4 Print via isolated iframe with complete self-contained HTML ──
  const handlePrintA4 = () => {
    let iframe = document.getElementById('print-invoice-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-invoice-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const html = getA4InvoiceHtml(sale, items, settings);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print A4 error:', err);
      }
    }, 200);
  };

  // ── Trigger Thermal Print via isolated iframe with 80mm layout ─────────────
  const handlePrintThermal = () => {
    let iframe = document.getElementById('print-thermal-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-thermal-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const html = getThermalReceiptHtml(sale, items, settings);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print thermal error:', err);
      }
    }, 200);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice & Receipt"
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePrintThermal}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-ios"
            >
              🧾 Print Thermal Slip (80mm)
            </Button>

            <Button
              onClick={handlePrintA4}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-ios"
            >
              📄 Print A4 Invoice
            </Button>
          </div>
        </div>
      }
    >
      {/* ── View Switcher Tabs ──────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-center">
        <div className="inline-flex rounded-2xl border border-black/[0.06] bg-black/[0.03] p-1 dark:border-white/[0.08] dark:bg-[#1a1917]">
          <button
            type="button"
            onClick={() => setViewMode('a4')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              viewMode === 'a4'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
            }`}
          >
            📄 A4 Full Invoice
          </button>
          <button
            type="button"
            onClick={() => setViewMode('thermal')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              viewMode === 'thermal'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
            }`}
          >
            🧾 Thermal Slip (80mm POS)
          </button>
        </div>
      </div>

      {/* ── 1. A4 INVOICE VIEW ON SCREEN ────────────────────────────── */}
      <div
        className={`mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-800 shadow-sm dark:border-white/10 dark:bg-white dark:text-gray-900 ${
          viewMode === 'a4' ? 'block' : 'hidden'
        }`}
      >
        {/* Top Decorative Green Accent Bar & Corner Pattern */}
        <div className="relative overflow-hidden bg-white pb-6 pt-0">
          <div className="h-2.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500" />
          <div
            className="pointer-events-none absolute right-0 top-0 h-28 w-56 opacity-90"
            style={{
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #84cc16 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-36 w-44 opacity-40"
            style={{
              clipPath: 'polygon(100% 0, 30% 0, 100% 100%)',
              background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            }}
          />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-8 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">{businessName}</h1>
                <p className="text-xs text-gray-500">Retail & Point of Sale</p>
              </div>
            </div>

            <div className="pr-4 text-right text-xs leading-relaxed text-gray-600 sm:pr-6">
              <p className="font-semibold text-gray-800">Support & Inquiries</p>
              <p>support@retailerpos.com</p>
              <p>Official Store Counter</p>
              <p>+92 (300) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-8 py-4 text-center">
          <h2 className="text-2xl font-extrabold uppercase tracking-wider text-gray-900">
            INVOICE
          </h2>
        </div>

        <div className="px-8 pb-6 pt-2">
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Invoice Date:</span>
                <span className="font-semibold text-gray-900">{dateStr} ({timeStr})</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Invoice Number:</span>
                <span className="font-mono font-bold text-emerald-700">{sale.invoice_number}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Payment Status:</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  ✓ Paid Full
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Customer:</span>
                <span className="font-medium text-gray-800">{sale.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Cashier:</span>
                <span className="font-medium text-gray-800">{sale.cashier_name || 'Counter Staff'}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 font-bold text-gray-600">Payment Method:</span>
                <span className="font-semibold uppercase text-gray-900">{sale.payment_method || 'Cash'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-100 text-gray-700">
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Description</th>
                <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider">Quantity</th>
                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.id || item.product_id || idx} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{item.product_name || item.name}</p>
                    {item.barcode && <p className="text-[10px] text-gray-400">Barcode: {item.barcode}</p>}
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700">{fmt(item.price, currency)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                    {fmt(item.subtotal || item.price * item.quantity, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 border-t border-gray-200 pt-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-mono font-medium">{fmt(sale.subtotal, currency)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">- {fmt(discountVal, currency)}</span>
                </div>
              )}
              {taxVal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono font-medium">{fmt(taxVal, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-900 bg-gray-50 px-2 py-2.5 text-sm font-extrabold text-gray-900">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-800">{fmt(sale.total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 bg-gray-50/50 px-8 py-5 text-xs text-gray-600">
          <p className="font-bold uppercase tracking-wider text-gray-700">Terms & Conditions:</p>
          <p className="leading-relaxed text-gray-500">
            {footer} Please retain this invoice for proof of purchase and warranty. Returns/exchanges within 7 days in original condition.
          </p>
          <div className="mt-4 border-t border-gray-200 pt-3 text-center text-[11px] text-gray-400">
            For questions or support, contact <span className="font-semibold text-gray-700">{businessName}</span> — Invoice #{sale.invoice_number}
          </div>
        </div>
      </div>

      {/* ── 2. THERMAL RECEIPT VIEW ON SCREEN (80mm) ────────────────── */}
      <div
        className={`mx-auto w-full max-w-[340px] rounded-2xl border border-black/[0.1] bg-white p-5 text-black shadow-md dark:bg-white dark:text-black ${
          viewMode === 'thermal' ? 'block' : 'hidden'
        }`}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="center text-center">
          <h2 className="text-lg font-black tracking-tight uppercase" style={{ fontFamily: 'sans-serif' }}>
            {businessName}
          </h2>
          <p className="text-[11px] font-semibold text-gray-600">Retail & Point of Sale</p>
          <p className="text-[10px] text-gray-500">Phone: +92 (300) 123-4567</p>
          <div className="my-2 border-t border-dashed border-black" />
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-bold">Invoice #:</span>
            <span className="font-mono font-bold">{sale.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.cashier_name || 'Counter Staff'}</span>
          </div>
          {sale.customer_name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">{sale.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="font-bold uppercase">{sale.payment_method || 'CASH'}</span>
          </div>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dashed border-black text-[10px] font-bold uppercase">
              <th className="pb-1 text-left">Item</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-gray-200">
            {items.map((item, idx) => (
              <tr key={item.id || item.product_id || idx}>
                <td className="py-1.5 text-left">
                  <p className="font-bold leading-tight">{item.product_name || item.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {fmt(item.price, currency)} × {item.quantity}
                  </p>
                </td>
                <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                <td className="py-1.5 text-right font-mono font-bold">
                  {fmt(item.subtotal || item.price * item.quantity, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">{fmt(sale.subtotal, currency)}</span>
          </div>
          {discountVal > 0 && (
            <div className="flex justify-between font-bold">
              <span>Discount:</span>
              <span className="font-mono">- {fmt(discountVal, currency)}</span>
            </div>
          )}
          {taxVal > 0 && (
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span className="font-mono">{fmt(taxVal, currency)}</span>
            </div>
          )}

          <div className="my-1.5 border-t-2 border-black pt-1.5">
            <div className="flex justify-between text-base font-black">
              <span>TOTAL:</span>
              <span className="font-mono">{fmt(sale.total, currency)}</span>
            </div>
          </div>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="space-y-1 text-center text-[10px]">
          <p className="font-bold">{footer}</p>
          <p className="text-gray-500">Goods once sold will not be returned without bill</p>
          <p className="mt-2 text-gray-400 font-mono">*** Zyrax POS ***</p>
        </div>
      </div>
    </Modal>
  );
}
