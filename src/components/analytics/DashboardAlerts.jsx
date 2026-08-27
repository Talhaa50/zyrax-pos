import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

// ── Skeleton loader ────────────────────────────────────────────────────────────
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
      ))}
    </div>
  );
}

// ── Low-stock alert list ───────────────────────────────────────────────────────
export function LowStockAlert({ products = [], isLoading = false }) {
  if (isLoading) return <SkeletonLoader />;

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-6 text-center dark:border-emerald-800/40 dark:bg-emerald-900/10">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">All stock levels are healthy ✓</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/10">
      {products.slice(0, 5).map((p) => (
        <div key={p.id} className="flex items-center justify-between border-b border-amber-200/60 px-4 py-3 last:border-0 dark:border-amber-800/30">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
            <p className="text-xs text-gray-500">{p.sku}</p>
          </div>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            {p.quantity} left
          </span>
        </div>
      ))}
      {products.length > 5 && (
        <div className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
          +{products.length - 5} more items low on stock
        </div>
      )}
      <div className="border-t border-amber-200/60 px-4 py-3 dark:border-amber-800/30">
        <Link to="/admin/inventory" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300">
          View Inventory →
        </Link>
      </div>
    </div>
  );
}

// ── Hourly sales sparkline ─────────────────────────────────────────────────────
export function HourlySalesSparkline({ sales = [] }) {
  // Build hourly buckets 0–23
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0 }));
  for (const sale of sales) {
    const h = new Date(sale.created_at).getHours();
    hours[h].total += sale.total;
  }

  const max = Math.max(...hours.map((h) => h.total), 1);

  if (!sales.length) {
    return <p className="text-center text-sm text-gray-400">No sales today yet</p>;
  }

  return (
    <div className="flex h-20 items-end gap-0.5">
      {hours.map(({ hour, total }) => (
        <div
          key={hour}
          title={`${hour}:00 — ${formatCurrency(total)}`}
          className="group relative flex-1 cursor-default rounded-t-sm bg-brand-500/20 transition-all hover:bg-brand-500/60"
          style={{ height: `${Math.max((total / max) * 100, total > 0 ? 4 : 1)}%` }}
        />
      ))}
    </div>
  );
}

// ── Sync status — removed, no cloud sync in this system ───────────────────────
export function SyncStatus() { return null; }
