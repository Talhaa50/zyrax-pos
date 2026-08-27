import { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '../../services/api/reportsApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ReportHeader from '../../components/analytics/ReportHeader';

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-black/[0.08] p-16 text-center dark:border-white/[0.08]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] text-2xl dark:bg-white/[0.06]">🏷️</div>
      <p className="font-heading text-lg font-semibold text-gray-500">No product sales yet</p>
      <p className="mt-1 text-sm text-gray-400">Product performance will appear after sales are made</p>
    </div>
  );
}

function MarginBadge({ margin }) {
  if (margin >= 30) return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{margin.toFixed(1)}%</span>;
  if (margin >= 10) return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{margin.toFixed(1)}%</span>;
  return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{margin.toFixed(1)}%</span>;
}

export default function ProductReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useBusinessSettings();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getProductPerformance({ from: from || undefined, to: to || undefined, limit: 50 });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load product report:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const topProduct = products[0];
  const maxRevenue = topProduct?.revenue || 1;

  return (
    <div className="space-y-8 animate-fade-up">
      <ReportHeader
        title="Product Performance"
        description="Best sellers, slow movers and profit breakdown"
        showBack={false}
      />

      {/* Date range filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-ios transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
        {[
          { label: 'All time', f: '', t: '' },
          { label: 'Last 7d', f: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), t: today },
          { label: 'Last 30d', f: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), t: today },
        ].map((q) => (
          <button
            key={q.label}
            onClick={() => { setFrom(q.f); setTo(q.t); }}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
              from === q.f && to === q.t
                ? 'bg-brand-600 text-white shadow-ios'
                : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />)}
        </div>
      ) : !products.length ? (
        <EmptyState />
      ) : (
        <>
          {/* Visual ranking bar chart */}
          <div className="rounded-2xl border border-black/[0.05] bg-white p-6 dark:border-white/[0.07] dark:bg-[#1a1917]">
            <h3 className="mb-5 font-heading text-base font-semibold text-gray-800 dark:text-gray-100">Revenue Ranking</h3>
            <div className="space-y-3">
              {products.slice(0, 10).map((p, i) => {
                const pct = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={p.product_id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-700/70 text-white' : 'bg-black/[0.06] text-gray-500 dark:bg-white/[0.08] dark:text-gray-400'}`}>
                          {i + 1}
                        </span>
                        <span className="truncate font-semibold text-gray-800 dark:text-gray-100">{p.product_name}</span>
                      </div>
                      <span className="shrink-0 font-bold text-gray-900 dark:text-white">{formatMoney(p.revenue)}</span>
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

          {/* Full table */}
          <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
              <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">
                All Products <span className="ml-1 text-sm font-normal text-gray-400">({products.length} products)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Units Sold</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Cost</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Profit</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Margin</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Txns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {products.map((p, i) => {
                    const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                    return (
                      <tr key={p.product_id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{p.product_name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300">{p.units_sold}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900 dark:text-white">{formatMoney(p.revenue)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{formatMoney(p.cost)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(p.profit)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <MarginBadge margin={margin} />
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{p.transaction_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
