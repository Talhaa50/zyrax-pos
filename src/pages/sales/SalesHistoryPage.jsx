import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api/salesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import SalesTable from '../../components/tables/SalesTable';

export default function SalesHistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cashierFilter, setCashierFilter] = useState('');
  const [cashiers, setCashiers] = useState([]);
  const { currency, formatMoney } = useBusinessSettings();
  const navigate = useNavigate();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAll({
        limit: 500,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        cashier_id: cashierFilter || undefined,
      });
      setSales(data);

      // Build cashier list from results (deduplicate)
      const seen = new Set();
      const list = [];
      for (const s of data) {
        if (s.cashier_name && !seen.has(s.cashier_id)) {
          seen.add(s.cashier_id);
          list.push({ id: s.cashier_id, name: s.cashier_name });
        }
      }
      setCashiers(list);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, cashierFilter]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2>Sales History</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All completed transactions</p>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white px-5 py-3 dark:border-white/[0.07] dark:bg-[#1a1917]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Transactions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{loading ? '—' : sales.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/80 px-5 py-3 dark:border-brand-800/40 dark:bg-brand-900/20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{loading ? '—' : formatMoney(totalRevenue)}</p>
          </div>
        </div>
        {sales.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white px-5 py-3 dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Avg. Sale</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMoney(totalRevenue / sales.length)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || today}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={today}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />
        </div>
        {cashiers.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cashier</label>
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
            >
              <option value="">All cashiers</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        {(dateFrom || dateTo || cashierFilter) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setCashierFilter(''); }}
            className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-ios-inset transition-all hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />)}
        </div>
      ) : (
        <SalesTable
          sales={sales}
          currency={currency}
          onView={(s) => navigate(`/admin/sales/${s.id}`)}
        />
      )}
    </div>
  );
}
