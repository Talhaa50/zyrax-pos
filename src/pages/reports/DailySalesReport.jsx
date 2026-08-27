import { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '../../services/api/reportsApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ReportHeader from '../../components/analytics/ReportHeader';
import { BarChart } from '../../components/analytics/ChartWidgets';

function StatCard({ label, value, sub, accent }) {
  const accents = {
    brand: 'border-brand-200/80 bg-brand-50/70 text-brand-700 dark:border-brand-800/40 dark:bg-brand-900/20 dark:text-brand-300',
    green: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber: 'border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300',
    rose: 'border-rose-200/80 bg-rose-50/70 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300',
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-ios ${
        accent ? accents[accent] : 'border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="font-semibold text-gray-500">No sales or expense records found in this date range</p>
      <p className="mt-1 text-xs text-gray-400">Try selecting another date range above</p>
    </div>
  );
}

export default function DailySalesReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(today);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useBusinessSettings();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getSalesSummary({ from, to });
      setData(res);
    } catch (err) {
      console.error('Failed to load daily report:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary || {};
  const daily = data?.daily || [];
  const byPayment = data?.byPayment || [];
  const byCashier = data?.byCashier || [];
  const byExpenseCategory = data?.byExpenseCategory || [];
  const hasData = (summary.total_sales || 0) > 0 || (summary.total_expenses || 0) > 0;

  // Chart data: daily revenue (ascending chronological order)
  const trendItems = [...daily]
    .reverse()
    .slice(-14)
    .map((d) => ({
      label: d.date.slice(5),
      value: d.revenue,
    }));

  return (
    <div className="space-y-6 animate-fade-up">
      <ReportHeader
        title="Daily Sales & Financial Report"
        description="Daily sales, product costs, shop expenses, and true net profit breakdown."
      />

      {/* Date range controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={from}
            max={to}
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
        {/* Quick ranges */}
        {[
          { label: 'Today', f: today, t: today },
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
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />)}
          </div>
          <div className="h-48 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Main Profit & Financial Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue"   value={formatMoney(summary.total_revenue || 0)} sub={`${summary.total_sales || 0} transactions`} accent="brand" />
            <StatCard label="Gross Profit"    value={formatMoney(summary.gross_profit || 0)}  sub={`Cost: ${formatMoney(summary.total_cost || 0)}`} accent="green" />
            <StatCard label="Shop Expenses"   value={formatMoney(summary.total_expenses || 0)} sub="Operational costs" accent="rose" />
            <StatCard
              label="Net Profit"
              value={formatMoney(summary.net_profit || 0)}
              sub={summary.net_profit >= 0 ? 'Profitable period' : 'Net Loss'}
              accent={summary.net_profit >= 0 ? 'green' : 'amber'}
            />
          </div>

          {/* Secondary Stats Strip (Avg Sale, Khata Receivables, Discounts, Tax) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Average Sale</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatMoney(summary.avg_sale || 0)}</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-4 shadow-sm dark:border-rose-800/40 dark:bg-rose-900/20">
              <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Khata Receivables</p>
              <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">{formatMoney(summary.total_receivable || 0)}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Discounts Given</p>
              <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">{formatMoney(summary.total_discounts || 0)}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Tax Collected</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatMoney(summary.total_tax || 0)}</p>
            </div>
          </div>

          {/* Daily trend */}
          {trendItems.length > 1 && (
            <div className="rounded-2xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
              <h3 className="mb-1 font-heading text-base font-semibold text-gray-800 dark:text-gray-100">
                Revenue Trend
              </h3>
              <p className="mb-5 text-xs text-gray-400">Last {trendItems.length} days in selected range</p>
              <BarChart
                items={trendItems}
                valueKey="value"
                labelKey="label"
                formatValue={formatMoney}
              />
            </div>
          )}

          {/* Breakdowns Grid: Payment Methods, Cashier Performance, and Expense Categories */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Payment methods */}
            {byPayment.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
                <div className="border-b border-black/[0.05] px-5 py-3.5 dark:border-white/[0.07]">
                  <h3 className="font-heading text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Payment Methods
                  </h3>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {byPayment.map((p) => (
                      <tr key={p.payment_method} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3 font-semibold uppercase text-gray-700 dark:text-gray-300">
                          {p.payment_method === 'khata' ? 'Khata (Credit)' : p.payment_method}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">{p.count} sales</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {formatMoney(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cashier performance */}
            {byCashier.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
                <div className="border-b border-black/[0.05] px-5 py-3.5 dark:border-white/[0.07]">
                  <h3 className="font-heading text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Cashier Performance
                  </h3>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {byCashier.map((c, i) => (
                      <tr key={c.cashier_name || i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-100">
                          {i === 0 && <span className="mr-1 text-amber-500">🥇</span>}
                          {c.cashier_name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">{c.transactions} sales</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {formatMoney(c.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expense Categories */}
            {byExpenseCategory.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
                <div className="border-b border-black/[0.05] px-5 py-3.5 dark:border-white/[0.07]">
                  <h3 className="font-heading text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Expenses by Category
                  </h3>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {byExpenseCategory.map((e) => (
                      <tr key={e.category} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-100">
                          {e.category}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">{e.count} entries</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatMoney(e.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Day-by-day table */}
          {daily.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
              <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
                <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">
                  Day-by-Day Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Transactions</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {daily.map((d) => (
                      <tr key={d.date} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{d.date}</td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{d.transactions}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {formatMoney(d.revenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-gray-500">{formatMoney(d.avg_sale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
