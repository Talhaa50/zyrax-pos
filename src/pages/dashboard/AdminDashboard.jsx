import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { salesApi } from '../../services/api/salesApi';
import { productsApi } from '../../services/api/productsApi';
import { reportsApi } from '../../services/api/reportsApi';
import { customersApi } from '../../services/api/customersApi';
import { expensesApi } from '../../services/api/expensesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { LowStockAlert, HourlySalesSparkline, SkeletonLoader } from '../../components/analytics/DashboardAlerts';

function StatCard({ label, value, sub, alert, accent }) {
  const accents = {
    rose: 'border-rose-200/80 bg-rose-50/70 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300',
    amber: 'border-amber-300/60 bg-amber-50/80 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300',
    green: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300',
  };

  return (
    <div
      className={`rounded-3xl border p-5 transition-all duration-200 ease-ios hover:shadow-ios-md ${
        accent ? accents[accent] : alert ? accents.amber : 'ios-card border-black/[0.04] dark:border-white/[0.06]'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

        const [allSales, allProducts, invSummary, customerData, expenseData] = await Promise.all([
          salesApi.getAll({ limit: 500 }),
          productsApi.getAll(),
          reportsApi.getInventorySummary(),
          customersApi.getAll().catch(() => ({ stats: {} })),
          expensesApi.getAll({ from: monthStart }).catch(() => ({ summary: {} })),
        ]);

        const todaySales = allSales.filter(s => s.created_at?.slice(0, 10) === today);
        const weekSales  = allSales.filter(s => s.created_at?.slice(0, 10) >= weekAgo);
        const monthSales = allSales.filter(s => s.created_at?.slice(0, 10) >= monthStart);
        const lowStock   = allProducts.filter(p => p.quantity <= p.reorder_level && !p.archived);

        setLowStockProducts(lowStock);
        setStats({
          todayTotal: todaySales.reduce((s, x) => s + x.total, 0),
          todayCount: todaySales.length,
          todaySales,
          weekTotal: weekSales.reduce((s, x) => s + x.total, 0),
          monthTotal: monthSales.reduce((s, x) => s + x.total, 0),
          stockValue: invSummary?.total_retail_value ?? 0,
          lowStockCount: lowStock.length,
          khataReceivable: customerData?.stats?.total_receivable ?? 0,
          monthExpenses: expenseData?.summary?.thisMonth ?? 0,
        });
      } catch (error) {
        console.error('Dashboard load error:', error);
      }
    }

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2>Dashboard</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's Sales" value={stats ? formatMoney(stats.todayTotal) : '—'} sub={stats ? `${stats.todayCount} transactions` : ''} />
        <StatCard label="This Month Sales" value={stats ? formatMoney(stats.monthTotal) : '—'} />
        <StatCard label="Month Expenses" value={stats ? formatMoney(stats.monthExpenses) : '—'} accent="rose" sub="Shop operational costs" />
        <StatCard label="Khata Receivables" value={stats ? formatMoney(stats.khataReceivable) : '—'} accent="rose" sub="Outstanding customer credit" />
        <StatCard label="Inventory Value" value={stats ? formatMoney(stats.stockValue) : '—'} />
        <StatCard label="Low Stock Alerts" value={stats ? stats.lowStockCount : '—'} alert={stats && stats.lowStockCount > 0} sub={stats && stats.lowStockCount > 0 ? 'Products need restocking' : 'All stock healthy'} />
      </div>

      {stats ? (
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Today's Hourly Breakdown</h3>
            <div className="rounded-2xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
              <HourlySalesSparkline sales={stats.todaySales} />
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Low Stock Alerts</h3>
            <LowStockAlert products={lowStockProducts} isLoading={false} />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div><h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Today's Hourly Breakdown</h3><SkeletonLoader /></div>
          <div><h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Low Stock Alerts</h3><SkeletonLoader /></div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/pos" className="inline-flex items-center rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:bg-brand-500 active:scale-[0.97]">
          Open POS
        </Link>
        <Link to="/admin/khata" className="inline-flex items-center rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:bg-teal-500 active:scale-[0.97]">
          Open Khata
        </Link>
        <Link to="/admin/expenses" className="inline-flex items-center rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:bg-rose-500 active:scale-[0.97]">
          Record Expense
        </Link>
        <Link to="/admin/inventory" className="inline-flex items-center rounded-2xl bg-black/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 ease-ios hover:bg-black/[0.07] active:scale-[0.97] dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]">
          Manage Inventory
        </Link>
      </div>
    </div>
  );
}
