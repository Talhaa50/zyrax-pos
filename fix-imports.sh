#!/bin/bash

# Fix all IndexedDB and sync queue imports across the frontend

echo "Fixing all IndexedDB imports..."

# Fix InventoryPage
cat > src/pages/inventory/InventoryPage.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { productsApi } from '../../services/api/productsApi';
import { inventoryApi } from '../../services/api/inventoryApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import InventoryTable from '../../components/tables/InventoryTable';
import StockAdjustForm from '../../components/forms/StockAdjustForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const { formatMoney } = useBusinessSettings();
  const toast = useToast();

  const loadData = async () => {
    try {
      const [prods, invLogs] = await Promise.all([
        productsApi.getAll(),
        inventoryApi.getLogs({ limit: 50 })
      ]);
      setProducts(prods);
      setLogs(invLogs);
    } catch (err) {
      toast.error('Failed to load inventory data');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdjust = async (data) => {
    setLoading(true);
    try {
      await inventoryApi.adjust(data);
      toast.success('Inventory adjusted');
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = products.reduce((acc, p) => ({
    totalCost: acc.totalCost + (p.quantity * p.cost_price),
    totalRetail: acc.totalRetail + (p.quantity * p.selling_price),
    lowStock: acc.lowStock + (p.quantity <= p.reorder_level ? 1 : 0),
  }), { totalCost: 0, totalRetail: 0, lowStock: 0 });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2>Inventory Management</h2>
        <Button onClick={() => setModal({ type: 'adjust' })}>Adjust Stock</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/[0.04] bg-white p-4 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm text-gray-500">Total Cost Value</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(summary.totalCost)}</p>
        </div>
        <div className="rounded-xl border border-black/[0.04] bg-white p-4 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm text-gray-500">Total Retail Value</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(summary.totalRetail)}</p>
        </div>
        <div className="rounded-xl border border-black/[0.04] bg-white p-4 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{summary.lowStock}</p>
        </div>
      </div>

      <InventoryTable products={products} />

      <Modal open={!!modal} onClose={() => setModal(null)} title="Adjust Stock">
        <StockAdjustForm
          products={products}
          onSubmit={handleAdjust}
          onCancel={() => setModal(null)}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
EOF

# Fix SalesHistoryPage
cat > src/pages/sales/SalesHistoryPage.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api/salesApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import SalesTable from '../../components/tables/SalesTable';
import { useToast } from '../../components/ui/Toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useBusinessSettings();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await salesApi.getAll({ limit: 100 });
        setSales(data);
      } catch (err) {
        toast.error('Failed to load sales');
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  if (loading) return <div className="py-16 text-center">Loading sales...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2>Sales History</h2>
        <p className="mt-1 text-sm text-gray-500">{sales.length} transactions</p>
      </div>
      <SalesTable 
        sales={sales} 
        formatMoney={formatMoney}
        onView={(sale) => navigate(`/admin/sales/${sale.id}`)}
      />
    </div>
  );
}
EOF

# Fix AdminDashboard - simplified version
cat > src/pages/dashboard/AdminDashboard.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { salesApi } from '../../services/api/salesApi';
import { productsApi } from '../../services/api/productsApi';
import { reportsApi } from '../../services/api/reportsApi';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ sales: [], lowStock: [], inventory: null });
  const { formatMoney } = useBusinessSettings();
  const toast = useToast();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [salesData, lowStock, invSummary] = await Promise.all([
          salesApi.getAll({ limit: 10 }),
          productsApi.getAll().then(p => p.filter(x => x.quantity <= x.reorder_level)),
          reportsApi.getInventorySummary()
        ]);
        setStats({ sales: salesData, lowStock, inventory: invSummary });
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    loadDashboard();
  }, []);

  const todaySales = stats.sales.filter(s => 
    new Date(s.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back to Zyrax POS</p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm font-medium text-gray-500">Today's Sales</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(todayRevenue)}</p>
          <p className="mt-1 text-sm text-gray-400">{todaySales.length} transactions</p>
        </div>

        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm font-medium text-gray-500">Inventory Value</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(stats.inventory?.total_retail_value || 0)}</p>
          <p className="mt-1 text-sm text-gray-400">{stats.inventory?.total_products || 0} products</p>
        </div>

        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm font-medium text-gray-500">Low Stock</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{stats.lowStock.length}</p>
          <p className="mt-1 text-sm text-gray-400">items need restock</p>
        </div>

        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <p className="text-sm font-medium text-gray-500">Out of Stock</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.inventory?.out_of_stock_count || 0}</p>
          <p className="mt-1 text-sm text-gray-400">products unavailable</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <h3 className="font-semibold">Recent Sales</h3>
          <div className="mt-4 space-y-3">
            {stats.sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{sale.invoice_number}</p>
                  <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString()}</p>
                </div>
                <p className="font-semibold">{formatMoney(sale.total)}</p>
              </div>
            ))}
          </div>
          <Link to="/admin/sales" className="mt-4 block text-sm font-medium text-brand-600">
            View All Sales →
          </Link>
        </div>

        <div className="rounded-xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
          <h3 className="font-semibold">Low Stock Alert</h3>
          <div className="mt-4 space-y-3">
            {stats.lowStock.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                  {product.quantity} left
                </span>
              </div>
            ))}
          </div>
          <Link to="/admin/inventory" className="mt-4 block text-sm font-medium text-brand-600">
            View Inventory →
          </Link>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ All pages fixed!"
EOF

chmod +x fix-imports.sh
bash fix-imports.sh
