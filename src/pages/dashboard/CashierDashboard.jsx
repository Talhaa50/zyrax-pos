import { useEffect, useState } from 'react';
import { salesApi } from '../../services/api/salesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useAuth } from '../../hooks/useAuth';

export default function CashierDashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await salesApi.getAll({ cashier_id: user.id, limit: 10 });
        setSales(data);
      } catch (err) {
        console.error('Failed to load sales:', err);
      }
    };
    loadSales();
  }, [user]);

  const today = sales.filter(s => 
    new Date(s.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = today.reduce((sum, s) => sum + s.total, 0);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">My Sales</h2>
      
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Today's Sales</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(todayRevenue)}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="mt-2 text-3xl font-bold">{today.length}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Average Sale</p>
          <p className="mt-2 text-3xl font-bold">
            {today.length > 0 ? formatMoney(todayRevenue / today.length) : formatMoney(0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="mb-4 font-semibold">Recent Transactions</h3>
        <div className="space-y-3">
          {sales.slice(0, 10).map((sale) => (
            <div key={sale.id} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{sale.invoice_number}</p>
                <p className="text-sm text-gray-500">
                  {new Date(sale.created_at).toLocaleString()}
                </p>
              </div>
              <p className="font-semibold">{formatMoney(sale.total)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
