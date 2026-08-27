import { useEffect, useState } from 'react';
import { reportsApi } from '../../services/api/reportsApi';
import { inventoryApi } from '../../services/api/inventoryApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import InventoryTable from '../../components/tables/InventoryTable';
import ReportHeader from '../../components/analytics/ReportHeader';

function StatCard({ label, value, sub, accent = 'default' }) {
  const accents = {
    default: 'bg-white dark:bg-[#1a1917] border-black/[0.05] dark:border-white/[0.07]',
    green:   'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40',
    amber:   'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40',
    red:     'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-800/40',
    brand:   'bg-brand-50/80 dark:bg-brand-900/20 border-brand-200/60 dark:border-brand-800/40',
  };
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-ios-md ${accents[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function InventoryReport() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatMoney, currency } = useBusinessSettings();

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const [sum, stock] = await Promise.all([
          reportsApi.getInventorySummary(),
          inventoryApi.getStockLevels(),
        ]);
        setSummary(sum);
        setProducts(stock);
      } catch (err) {
        console.error('Failed to load inventory report:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  const categories = summary?.categories || [];
  const maxCatValue = Math.max(...categories.map((c) => c.value), 1);

  return (
    <div className="space-y-8 animate-fade-up">
      <ReportHeader
        title="Inventory Report"
        description="Current stock value, category breakdown and low stock status"
        showBack={false}
      />

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />)}
          </div>
          <div className="h-48 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      ) : (
        <>
          {/* 6 stat cards */}
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Total Products" value={summary.total_products} accent="brand" />
              <StatCard label="Total Units"    value={summary.total_units?.toLocaleString() ?? 0} sub="across all products" />
              <StatCard label="Cost Value"     value={formatMoney(summary.total_cost)} sub="purchase cost" />
              <StatCard label="Retail Value"   value={formatMoney(summary.total_retail_value)} sub="selling price value" accent="green" />
              <StatCard
                label="Low Stock"
                value={summary.low_stock_count ?? 0}
                sub={summary.low_stock_count > 0 ? 'need restocking' : 'all healthy'}
                accent={summary.low_stock_count > 0 ? 'amber' : 'default'}
              />
              <StatCard
                label="Out of Stock"
                value={summary.out_of_stock_count ?? 0}
                sub={summary.out_of_stock_count > 0 ? 'zero quantity' : 'none out of stock'}
                accent={summary.out_of_stock_count > 0 ? 'red' : 'default'}
              />
            </div>
          )}

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="rounded-2xl border border-black/[0.05] bg-white p-6 dark:border-white/[0.07] dark:bg-[#1a1917]">
              <h3 className="mb-5 font-heading text-base font-semibold text-gray-800 dark:text-gray-100">Value by Category</h3>
              <div className="space-y-4">
                {categories.map((cat) => {
                  const pct = (cat.value / maxCatValue) * 100;
                  return (
                    <div key={cat.category}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate font-semibold capitalize text-gray-800 dark:text-gray-100">{cat.category}</span>
                          <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.07] dark:text-gray-400">
                            {cat.products} product{cat.products !== 1 ? 's' : ''} · {cat.units} units
                          </span>
                        </div>
                        <span className="shrink-0 font-bold text-gray-900 dark:text-white">{formatMoney(cat.value)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700 ease-ios"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock level table */}
          <div>
            <h3 className="mb-3 font-heading text-base font-semibold text-gray-700 dark:text-gray-300">All Products — Stock Levels</h3>
            <InventoryTable products={products} currency={currency} />
          </div>
        </>
      )}
    </div>
  );
}
