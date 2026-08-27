import { useEffect, useState } from 'react';
import { reportsApi } from '../../services/api/reportsApi';
import { salesApi } from '../../services/api/salesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { useNavigate } from 'react-router-dom';
import ReportHeader from '../../components/analytics/ReportHeader';

/* ── Payment badge ─────────────────────────────────────────────────────── */
function PayBadge({ method }) {
  const map = {
    cash:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    card:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    mobile: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[method] ?? 'bg-black/[0.06] text-gray-700 dark:bg-white/[0.08] dark:text-gray-300'}`}>
      {method}
    </span>
  );
}

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent = 'default' }) {
  const accents = {
    default: 'bg-white dark:bg-[#1a1917] border-black/[0.05] dark:border-white/[0.07]',
    green:   'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40',
    blue:    'bg-brand-50/80 dark:bg-brand-900/20 border-brand-200/60 dark:border-brand-800/40',
    amber:   'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40',
    red:     'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-800/40',
  };
  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-ios-md ${accents[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { currency } = useBusinessSettings();
  const fmt = (v) => formatCurrency(v, currency);

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [range, setRange] = useState({ from: firstOfMonth, to: today });
  const [report, setReport] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rep, sales] = await Promise.all([
          reportsApi.getSalesSummary(range),
          salesApi.getAll({ limit: 20, from: range.from, to: range.to }),
        ]);
        setReport(rep);
        setRecentSales(sales);
      } catch (e) {
        console.error('Reports load failed:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [range]);

  const s = report?.summary;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header with tab nav */}
      <ReportHeader
        title="Reports & Analytics"
        description={`${range.from}  →  ${range.to}`}
        showBack={false}
      />

      {/* Date range controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        {[
          { label: 'Today',      from: today,        to: today },
          { label: 'This Month', from: firstOfMonth, to: today },
          { label: 'Last 7d',    from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), to: today },
        ].map((q) => (
          <button
            key={q.label}
            onClick={() => setRange({ from: q.from, to: q.to })}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
              range.from === q.from && range.to === q.to
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
          <div className="h-64 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue"  value={fmt(s?.total_revenue ?? 0)} sub={`${s?.total_sales ?? 0} transactions`} accent="green" />
            <StatCard label="Gross Profit"   value={fmt(s?.gross_profit ?? 0)} sub={`Cost: ${fmt(s?.total_cost ?? 0)}`} accent="blue" />
            <StatCard label="Shop Expenses"  value={fmt(s?.total_expenses ?? 0)} sub="Operational costs" accent="red" />
            <StatCard
              label="Net Profit"
              value={fmt(s?.net_profit ?? 0)}
              sub={s?.net_profit >= 0 ? 'Profitable' : 'Net Loss'}
              accent={s?.net_profit >= 0 ? 'green' : 'amber'}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Average Sale</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{fmt(s?.avg_sale ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-4 shadow-sm dark:border-rose-800/40 dark:bg-rose-900/20">
              <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Khata Receivables</p>
              <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">{fmt(s?.total_receivable ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Tax Collected</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{fmt(s?.total_tax ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#1a1917]">
              <p className="text-xs font-semibold uppercase text-gray-400">Discounts</p>
              <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">{fmt(s?.total_discounts ?? 0)}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          {report?.daily?.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]">
              <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
                <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">Daily Breakdown</h3>
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
                    {report.daily.map((d) => (
                      <tr key={d.date} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{d.date}</td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{d.transactions}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">{fmt(d.revenue)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{fmt(d.avg_sale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment methods + Cashier side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {report?.byPayment?.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]">
                <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
                  <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">Payment Methods</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Method</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Count</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {report.byPayment.map((p) => (
                      <tr key={p.payment_method} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5"><PayBadge method={p.payment_method} /></td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{p.count}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">{fmt(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {report?.byCashier?.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]">
                <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
                  <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">Cashier Performance</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cashier</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Sales</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {report.byCashier.map((c, i) => (
                      <tr key={c.cashier_name || i} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">
                          {i === 0 && <span className="mr-1.5 text-amber-500">🥇</span>}
                          {c.cashier_name ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{c.transactions}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">{fmt(c.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="border-b border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
              <h3 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-100">
                Recent Transactions <span className="ml-1 text-sm font-normal text-gray-400">({recentSales.length})</span>
              </h3>
            </div>
            {recentSales.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No transactions in this date range</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date & Time</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cashier</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Items</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {recentSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                        onClick={() => navigate(`/admin/sales/${sale.id}`)}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{sale.invoice_number}</td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(sale.created_at)}</td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{sale.cashier_name ?? '—'}</td>
                        <td className="px-5 py-3.5"><PayBadge method={sale.payment_method} /></td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{sale.item_count ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">{fmt(sale.total)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">View →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/[0.06] bg-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <td colSpan={5} className="px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">Period Total</td>
                      <td className="px-5 py-3 text-right text-base font-bold text-gray-900 dark:text-white">{fmt(s?.total_revenue ?? 0)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
