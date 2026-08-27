import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { salesApi } from '../../services/api/salesApi';
import { formatDate } from '../../utils/formatCurrency';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ReceiptModal from '../../components/modals/ReceiptModal';
import Button from '../../components/ui/Button';

export default function SaleDetailPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { formatMoney, settings } = useBusinessSettings();

  useEffect(() => {
    const loadSale = async () => {
      try {
        const data = await salesApi.getOne(id);
        setSale(data);
      } catch (err) {
        console.error('Failed to load sale:', err);
      }
    };
    loadSale();
  }, [id]);

  if (!sale) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500">Loading sale details...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/sales"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            ← Back to Sales History
          </Link>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sale {sale.invoice_number}
          </h2>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowInvoiceModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 shadow-ios"
          >
            📄 View & Print Invoice
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-black/[0.02] p-4 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date & Time</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">{formatDate(sale.created_at)}</p>
          </div>
          <div className="rounded-2xl bg-black/[0.02] p-4 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment Method</p>
            <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">{sale.payment_method}</p>
          </div>
          <div className="rounded-2xl bg-black/[0.02] p-4 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cashier</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">{sale.cashier_name || 'Staff'}</p>
          </div>
        </div>

        <div className="border-t border-black/[0.04] pt-4 dark:border-white/[0.06]">
          <h3 className="mb-4 font-heading text-base font-semibold text-gray-800 dark:text-gray-100">
            Items Ordered ({sale.items?.length || 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {sale.items?.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{item.product_name}</td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-300">{formatMoney(item.price)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">{formatMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-black/[0.04] pt-4 dark:border-white/[0.06]">
          <div className="w-full sm:w-80 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">{formatMoney(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-mono">- {formatMoney(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax ({sale.tax_rate}%)</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatMoney(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black/[0.06] pt-3 text-lg font-bold text-gray-900 dark:border-white/[0.08] dark:text-white">
              <span>Total</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(sale.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        sale={sale}
        items={sale.items || []}
        settings={settings}
      />
    </div>
  );
}
