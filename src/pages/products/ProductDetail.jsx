import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../../services/api/productsApi';
import { inventoryApi } from '../../services/api/inventoryApi';
import Badge, { stockBadge, stockLabel } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prod, invLogs] = await Promise.all([
          productsApi.getOne(id),
          inventoryApi.getLogs({ product_id: id, limit: 20 })
        ]);
        setProduct(prod);
        setLogs(invLogs);
      } catch (err) {
        console.error('Failed to load product:', err);
      }
    };
    loadData();
  }, [id]);

  if (!product) return <div className="py-16 text-center">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/products" className="text-sm text-brand-600">← Back to Products</Link>
        <h2 className="mt-2">{product.name}</h2>
        <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
          {stockLabel(product.quantity, product.reorder_level)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h3 className="mb-4 font-semibold">Product Information</h3>
          <dl className="space-y-3">
            <div><dt className="text-sm text-gray-500">SKU</dt><dd className="font-medium">{product.sku || 'N/A'}</dd></div>
            <div><dt className="text-sm text-gray-500">Barcode</dt><dd className="font-medium">{product.barcode || 'N/A'}</dd></div>
            <div><dt className="text-sm text-gray-500">Category</dt><dd className="font-medium">{product.category || 'N/A'}</dd></div>
            <div><dt className="text-sm text-gray-500">Cost Price</dt><dd className="font-medium">{formatCurrency(product.cost_price)}</dd></div>
            <div><dt className="text-sm text-gray-500">Selling Price</dt><dd className="font-medium">{formatCurrency(product.selling_price)}</dd></div>
            <div><dt className="text-sm text-gray-500">Quantity</dt><dd className="font-medium">{product.quantity}</dd></div>
            <div><dt className="text-sm text-gray-500">Reorder Level</dt><dd className="font-medium">{product.reorder_level}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="mb-4 font-semibold">Inventory History</h3>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{log.type}</p>
                  <p className="text-sm text-gray-500">{formatDate(log.created_at)}</p>
                </div>
                <span className={`font-semibold ${log.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {log.quantity > 0 ? '+' : ''}{log.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
