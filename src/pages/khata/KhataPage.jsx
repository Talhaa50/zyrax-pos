import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../services/api/customersApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function KhataPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { formatMoney } = useBusinessSettings();

  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total_customers: 0, total_receivable: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Customer Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    opening_balance: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersApi.getAll({ search });
      setCustomers(data.customers || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Customer name is required' });
      return;
    }

    setSubmitting(true);
    try {
      await customersApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        opening_balance: form.opening_balance ? Number(form.opening_balance) : 0,
      });

      toast.success(`Customer ${form.name} added successfully!`);
      setForm({ name: '', phone: '', address: '', opening_balance: '' });
      setErrors({});
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      await customersApi.delete(deletingCustomer.id);
      toast.success(`Customer ${deletingCustomer.name} removed`);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>Khata / Customer Ledger</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage credit accounts, customer ledgers, and track outstanding balances.
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-rose-200/60 bg-rose-50/80 px-4 py-2 text-right dark:border-rose-800/40 dark:bg-rose-900/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Khata Receivable
            </p>
            <p className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
              {formatMoney(stats.total_receivable || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout (Matching Reference Image 1) ─────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── Left Column: Add Customer Card (4 cols) ───────────────── */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="mb-4 flex items-center gap-2 border-b border-black/[0.04] pb-3 dark:border-white/[0.06]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 font-bold text-sm">
                ⊕
              </span>
              <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
                Add Customer
              </h3>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. HARIS DECORATION"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setErrors({ ...errors, name: null });
                }}
                error={errors.name}
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="e.g. 03000000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <Input
                label="Address"
                placeholder="e.g. Shop #4, Main Bazaar"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <Input
                label="Opening Balance (PKR)"
                type="number"
                placeholder="0 (if previous credit exists)"
                value={form.opening_balance}
                onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              />

              <Button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-600 shadow-ios"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Customer'}
              </Button>
            </form>
          </div>
        </div>

        {/* ── Right Column: Customer List Card (8 cols) ──────────────── */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
            <div className="mb-4 flex items-center justify-between border-b border-black/[0.04] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">👥</span>
                <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
                  Customer List
                </h3>
              </div>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
                {customers.length} total
              </span>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by Name or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-ios-inset placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
              />
            </div>

            {/* Table */}
            {loading ? (
              <div className="animate-pulse space-y-3 py-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-semibold text-gray-500">No customers found</p>
                <p className="mt-1 text-xs text-gray-400">
                  {search ? 'Try another search term' : 'Add a customer using the form on the left'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sky-50/60 text-sky-900 dark:bg-white/[0.04] dark:text-gray-300">
                    <tr>
                      <th className="rounded-l-xl px-4 py-3 text-xs font-bold uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Balance</th>
                      <th className="rounded-r-xl px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {customers.map((c) => {
                      const hasBalance = c.balance > 0;
                      const hasAdvance = c.balance < 0;
                      return (
                        <tr
                          key={c.id}
                          className="cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                          onClick={() => navigate(`/admin/khata/${c.id}`)}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-gray-900 dark:text-white uppercase">{c.name}</p>
                            {c.address && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{c.address}</p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                            {c.phone || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold">
                            {hasBalance ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                {formatMoney(c.balance)}
                              </span>
                            ) : hasAdvance ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {formatMoney(c.balance)} (Adv)
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatMoney(0)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Open Ledger */}
                              <button
                                type="button"
                                title="Open Khata Ledger"
                                onClick={() => navigate(`/admin/khata/${c.id}`)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-all hover:bg-teal-100 active:scale-90 dark:bg-teal-900/30 dark:text-teal-300"
                              >
                                →
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete Customer"
                                onClick={() => setDeletingCustomer(c)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 transition-all hover:bg-rose-50 active:scale-90 dark:text-rose-400 dark:hover:bg-rose-900/30"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm Delete Modal ────────────────────────────────────── */}
      <ConfirmModal
        open={!!deletingCustomer}
        onClose={() => !deleteLoading && setDeletingCustomer(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Customer: ${deletingCustomer?.name}`}
        message={`Are you sure you want to remove ${deletingCustomer?.name}? All Khata ledger records for this customer will also be deleted.`}
        loading={deleteLoading}
      />
    </div>
  );
}
