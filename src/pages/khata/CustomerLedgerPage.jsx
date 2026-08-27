import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customersApi } from '../../services/api/customersApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { formatDate } from '../../utils/formatCurrency';

export default function CustomerLedgerPage() {
  const { id } = useParams();
  const toast = useToast();
  const { formatMoney } = useBusinessSettings();

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transaction modal state
  const [modalType, setModalType] = useState(null); // 'CREDIT' (Payment In) or 'DEBIT' (Give Credit)
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersApi.getOne(id);
      setCustomer(data.customer);
      setTransactions(data.transactions || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await customersApi.addTransaction(id, {
        type: modalType,
        amount: numAmount,
        note: note.trim(),
      });

      toast.success(
        modalType === 'CREDIT'
          ? `Received payment of ${formatMoney(numAmount)}`
          : `Added credit of ${formatMoney(numAmount)}`
      );

      setModalType(null);
      setAmount('');
      setNote('');
      fetchLedger();
    } catch (err) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  if (loading && !customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500">Loading customer ledger...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-bold text-gray-700">Customer not found</p>
        <Link to="/admin/khata" className="mt-2 inline-block text-sm text-brand-600">
          ← Return to Khata
        </Link>
      </div>
    );
  }

  const isDue = customer.balance > 0;
  const isAdvance = customer.balance < 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/khata"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
          >
            ← Back to Khata List
          </Link>
          <h2 className="mt-1 uppercase">{customer.name}</h2>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.address && <span>📍 {customer.address}</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={() => {
              setModalType('CREDIT');
              setAmount('');
              setNote('Cash Payment Received');
            }}
            className="bg-emerald-600 hover:bg-emerald-500 shadow-ios"
          >
            🟢 Receive Payment (Wasool)
          </Button>

          <Button
            onClick={() => {
              setModalType('DEBIT');
              setAmount('');
              setNote('Manual Credit Given');
            }}
            className="bg-rose-600 hover:bg-rose-500 shadow-ios"
          >
            🔴 Give Credit (Udhaar)
          </Button>

          <button
            type="button"
            onClick={handlePrintLedger}
            className="rounded-2xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-200"
          >
            🖨 Print Ledger
          </button>
        </div>
      </div>

      {/* ── Balance Summary Card ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-3xl border p-6 shadow-ios transition-all ${
            isDue
              ? 'border-rose-300/80 bg-rose-50/80 dark:border-rose-800/40 dark:bg-rose-900/20'
              : isAdvance
              ? 'border-emerald-300/80 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-900/20'
              : 'border-black/[0.05] bg-white dark:border-white/[0.07] dark:bg-[#1a1917]'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Current Outstanding Balance
          </p>
          <p
            className={`mt-2 text-3xl font-extrabold font-mono ${
              isDue
                ? 'text-rose-700 dark:text-rose-300'
                : isAdvance
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {formatMoney(Math.abs(customer.balance || 0))}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isDue
              ? 'Customer owes this amount to shop'
              : isAdvance
              ? 'Advance deposit with shop'
              : 'All dues cleared'}
          </p>
        </div>

        <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Ledger Entries
          </p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {transactions.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">Payments & credit transactions</p>
        </div>

        <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Customer Since
          </p>
          <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
            {customer.created_at ? formatDate(customer.created_at) : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Active account</p>
        </div>
      </div>

      {/* ── Transaction Ledger Table ─────────────────────────────────── */}
      <div className="rounded-3xl border border-black/[0.05] bg-white p-6 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
        <div className="mb-4 flex items-center justify-between border-b border-black/[0.04] pb-3 dark:border-white/[0.06]">
          <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
            Ledger Statement / Transaction History
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No transactions recorded yet for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Description / Note</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-rose-600">
                    Debit (Took Credit)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Credit (Payment In)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {transactions.map((t) => {
                  const isDebit = t.type === 'DEBIT';
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                        {t.note || (isDebit ? 'Credit Given' : 'Payment Received')}
                        {t.reference_id && t.reference_id !== 'OPENING' && (
                          <span className="ml-2 inline-block rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-mono text-gray-600 dark:bg-white/[0.08] dark:text-gray-400">
                            {t.reference_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {isDebit ? formatMoney(t.amount) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {!isDebit ? formatMoney(t.amount) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                        {formatMoney(t.balance_after)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-gray-400">
                        {t.creator_name || 'Staff'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Transaction Action Modal (Receive Payment or Give Credit) ─── */}
      <Modal
        open={!!modalType}
        onClose={() => !submitting && setModalType(null)}
        title={
          modalType === 'CREDIT'
            ? `Receive Payment from ${customer.name}`
            : `Give Credit to ${customer.name}`
        }
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setModalType(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransactionSubmit}
              disabled={submitting}
              className={modalType === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}
            >
              {submitting ? 'Saving...' : modalType === 'CREDIT' ? 'Receive Payment' : 'Save Credit'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          <div className={`rounded-xl p-3.5 text-xs ${modalType === 'CREDIT' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'}`}>
            {modalType === 'CREDIT'
              ? `Recording payment received from customer. This will reduce their outstanding balance.`
              : `Recording new credit (Udhaar) taken by customer. This will increase their balance.`}
          </div>

          <Input
            label="Amount (PKR)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Note / Reference"
            placeholder={modalType === 'CREDIT' ? 'e.g. Cash received by cashier' : 'e.g. 5 boxes decoration lights on credit'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
