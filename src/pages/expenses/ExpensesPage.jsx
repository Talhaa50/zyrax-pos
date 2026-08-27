import { useEffect, useState, useCallback } from 'react';
import { expensesApi } from '../../services/api/expensesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const EXPENSE_CATEGORIES = [
  'General',
  'Food & Tea',
  'Utilities & Bills',
  'Rent',
  'Salaries',
  'Transport',
  'Supplies',
  'Maintenance',
];

export default function ExpensesPage() {
  const toast = useToast();
  const { formatMoney } = useBusinessSettings();

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, today: 0, thisMonth: 0, byCategory: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Add Expense form state
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'General',
    date: today,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getAll({
        from,
        to,
        category: categoryFilter,
        search,
      });
      setExpenses(data.expenses || []);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      toast.error(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [from, to, categoryFilter, search, toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.description.trim()) errs.description = 'Description is required';
    const numAmount = Number(form.amount);
    if (!numAmount || numAmount <= 0) errs.amount = 'Valid amount is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.create({
        description: form.description.trim(),
        amount: numAmount,
        category: form.category,
        date: form.date || today,
      });

      toast.success(`Expense "${form.description}" added!`);
      setForm({
        description: '',
        amount: '',
        category: 'General',
        date: today,
      });
      setErrors({});
      fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await expensesApi.delete(deletingExpense.id);
      toast.success('Expense deleted');
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>Expenses Management</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Record shop expenses (tea, food, bills, rent) and track operational costs.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-2xl border border-rose-200/60 bg-rose-50/80 px-4 py-2 text-right dark:border-rose-800/40 dark:bg-rose-900/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Period Total
            </p>
            <p className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
              {formatMoney(summary.total || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Today's Expenses</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatMoney(summary.today || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">This Month</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatMoney(summary.thisMonth || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recorded Entries</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            {expenses.length}
          </p>
        </div>
      </div>

      {/* ── Main Two-Column Layout (Matching Reference Image 2) ─────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── Left Column: Add Expense Card (4 cols) ────────────────── */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="mb-4 flex items-center gap-2 border-b border-black/[0.04] pb-3 dark:border-white/[0.06]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold text-sm">
                ⊕
              </span>
              <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
                Add Expense
              </h3>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <Input
                label="Description"
                placeholder="e.g. Tea, Rent, Electricity Bill"
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  setErrors({ ...errors, description: null });
                }}
                error={errors.description}
              />

              <Input
                label="Amount (PKR)"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  setErrors({ ...errors, amount: null });
                }}
                error={errors.amount}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 shadow-ios-inset focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Date"
                type="date"
                value={form.date}
                max={today}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 shadow-ios text-white font-bold"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </div>
        </div>

        {/* ── Right Column: Expense History Card (8 cols) ───────────── */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="mb-4 flex items-center justify-between border-b border-black/[0.04] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🧾</span>
                <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
                  Expense History
                </h3>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase text-gray-400">From</label>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-ios-inset dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase text-gray-400">To</label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-ios-inset dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase text-gray-400">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-ios-inset dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] font-semibold uppercase text-gray-400">Search</label>
                <input
                  type="text"
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-ios-inset placeholder:text-gray-400 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="animate-pulse space-y-3 py-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-semibold text-gray-500">No expenses recorded in this period</p>
                <p className="mt-1 text-xs text-gray-400">
                  Add an expense using the form on the left
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sky-50/60 text-sky-900 dark:bg-white/[0.04] dark:text-gray-300">
                    <tr>
                      <th className="rounded-l-xl px-4 py-3 text-xs font-bold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                      <th className="rounded-r-xl px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {expenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {exp.date}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                          {exp.description}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatMoney(exp.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            title="Delete Expense"
                            onClick={() => setDeletingExpense(exp)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 transition-all hover:bg-rose-50 active:scale-90 dark:text-rose-400 dark:hover:bg-rose-900/30 ml-auto"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm Delete Modal ────────────────────────────────────── */}
      <ConfirmModal
        open={!!deletingExpense}
        onClose={() => !deleteLoading && setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Expense`}
        message={`Are you sure you want to delete this expense "${deletingExpense?.description}" (${formatMoney(deletingExpense?.amount || 0)})?`}
        loading={deleteLoading}
      />
    </div>
  );
}
