import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { productsApi } from '../../services/api/productsApi';
import { salesApi } from '../../services/api/salesApi';
import { customersApi } from '../../services/api/customersApi';
import { generateInvoiceNumber, generateId } from '../../utils/generateInvoiceNumber';
import ReceiptModal from '../../components/modals/ReceiptModal';
import Button from '../../components/ui/Button';
import ProductCard, { ProductCardGrid } from '../../components/products/ProductCard';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';
import { barcodeLookup } from '../../services/api/barcodeLookup';

export default function POSPage() {
  const { user } = useAuth();
  const cart = useCart();
  const { settings, formatMoney } = useBusinessSettings();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);

  // Khata customer selection state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const searchRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Fetch customers for Khata
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await customersApi.getAll();
        setCustomers(res.customers || []);
      } catch (err) {
        console.error('Failed to load customers for POS:', err);
      }
    }
    loadCustomers();
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      try {
        if (query.trim()) {
          const results = await productsApi.search(query);
          setProducts(results);
        } else {
          const all = await productsApi.getAll();
          setProducts(all);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    };
    searchProducts();
  }, [query]);

  const handleBarcodeSearch = async () => {
    if (!query.trim()) return;
    const localMatch = products.find((p) => p.barcode === query.trim());
    if (localMatch && localMatch.quantity > 0) {
      cart.addItem(localMatch);
      setQuery('');
      toast.success(`Added ${localMatch.name}`);
      return;
    }

    if (products.length === 0) {
      setLookingUpBarcode(true);
      try {
        const result = await barcodeLookup.lookup(query.trim());
        if (result.found) toast.info(`Product not in inventory: ${result.name}`);
        else toast.warning('Barcode not found in database');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLookingUpBarcode(false);
      }
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && query.trim()) handleBarcodeSearch();
  };

  const handleCheckout = async () => {
    if (!cart.items.length || checkingOut) return;

    let selectedCustomer = null;
    if (paymentMethod === 'khata') {
      if (!selectedCustomerId) {
        toast.warning('Please select a customer for Khata (Credit) checkout');
        return;
      }
      selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    }

    setCheckingOut(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const saleId = generateId('sale');

      const sale = {
        id: saleId,
        invoice_number: invoiceNumber,
        cashier_id: user.id,
        cashier_name: user.name || 'Counter Staff',
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || null,
        subtotal: cart.subtotal,
        discount: 0,
        discount_amount: cart.discountAmount,
        tax_rate: 0,
        tax_amount: 0,
        total: cart.afterDiscount,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };

      const items = cart.items.map((item) => ({
        id: generateId('item'),
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        cost_price: item.cost_price,
        subtotal: item.price * item.quantity,
        product_name: item.name,
      }));

      await salesApi.create(sale, items);

      setReceipt({ sale, items });
      cart.clearCart();
      setSelectedCustomerId('');
      toast.success(
        paymentMethod === 'khata'
          ? `Sale completed on Khata for ${selectedCustomer?.name}!`
          : 'Sale completed successfully!'
      );

      // Refresh products to update stock
      const all = await productsApi.getAll();
      setProducts(all);
      setQuery('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const inStock = products.filter((p) => p.quantity > 0 && !p.archived);

  return (
    <div className="grid h-full min-h-0 bg-surface-secondary dark:bg-black lg:grid-cols-[minmax(0,1fr)_25rem] overflow-hidden">
      {/* ── Products Column ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 min-h-0 flex-col border-r border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
        <div className="shrink-0 border-b border-black/[0.04] bg-white/75 p-4 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/75">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Sales terminal</p>
              <h2 className="mt-1">Point of Sale</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300">
                {inStock.length} in stock
              </span>
              <span className="rounded-full bg-brand-500/10 px-3 py-1.5 text-brand-700 dark:text-brand-300">
                {cart.itemCount} cart items
              </span>
            </div>
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products or scan barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleBarcodeScan}
            className="w-full rounded-2xl border border-black/[0.06] bg-white px-5 py-3.5 text-base font-medium shadow-ios transition-all duration-200 ease-ios placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <ProductCardGrid className="auto-rows-max">
            {inStock.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                price={formatMoney(p.selling_price)}
                onClick={() => cart.addItem(p)}
              />
            ))}
            {inStock.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-gray-500">
                No products found
              </div>
            )}
          </ProductCardGrid>
        </div>
      </div>

      {/* ── Cart / Checkout Column ──────────────────────────────────── */}
      <div className="flex h-full min-h-0 flex-col bg-white/90 backdrop-blur-ios dark:bg-surface-dark/90 overflow-hidden">
        <div className="shrink-0 border-b border-black/[0.04] px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center justify-between gap-3 text-base">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Current sale</p>
              <h3 className="font-heading text-lg font-bold">Cart</h3>
            </div>
            <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
              {cart.itemCount} items
            </span>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.product_id}
                  className="rounded-2xl border border-black/[0.04] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => cart.removeItem(item.product_id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500 transition-all active:scale-90"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.05] text-sm font-bold transition-all active:scale-90 dark:bg-white/[0.08]"
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.05] text-sm font-bold transition-all active:scale-90 dark:bg-white/[0.08]"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold font-mono">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Summary & Payment Methods - ALWAYS FIXED AT BOTTOM OF SCREEN */}
        <div className="shrink-0 space-y-3.5 border-t border-black/[0.04] p-4 bg-white/95 backdrop-blur-md dark:border-white/[0.06] dark:bg-surface-dark/95">
          {/* Discount controls */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Discount (PKR)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[0, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => cart.setDiscountAmount(amt)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                    cart.discountAmount === amt
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-black/[0.05] text-gray-700 hover:bg-black/[0.09] dark:bg-white/[0.08] dark:text-gray-300'
                  }`}
                >
                  {amt === 0 ? 'None' : `${amt}`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              value={cart.discountAmount === 0 ? '' : cart.discountAmount}
              placeholder="Custom amount..."
              onChange={(e) => cart.setDiscountAmount(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-xs font-semibold dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
            />
          </div>

          {/* Subtotal / Total numbers */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatMoney(cart.subtotal)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-semibold">- {formatMoney(cart.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black/[0.04] pt-1.5 text-base font-bold dark:border-white/[0.06]">
              <span>Total</span>
              <span className="font-mono text-lg text-brand-600 dark:text-brand-400">
                {formatMoney(cart.afterDiscount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector (Cash, Card, Mobile, Khata) */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'card', label: 'Card' },
                { id: 'mobile', label: 'Mobile' },
                { id: 'khata', label: 'Khata' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`rounded-xl py-2 text-xs font-bold capitalize transition-all duration-200 ease-ios active:scale-[0.97] ${
                    paymentMethod === m.id
                      ? m.id === 'khata'
                        ? 'bg-rose-500/15 text-rose-700 ring-2 ring-rose-500/40 dark:bg-rose-500/20 dark:text-rose-300'
                        : 'bg-brand-500/10 text-brand-700 ring-2 ring-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* If Khata is selected, show Customer Dropdown */}
          {paymentMethod === 'khata' && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-2.5 dark:border-rose-800/40 dark:bg-rose-900/20 space-y-1">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                Select Khata Customer:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-rose-300/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-rose-700 dark:bg-[#1a1917] dark:text-white"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatMoney(c.balance || 0)}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-[11px] text-rose-600">
                  No customers found. Add customers in the Khata section first.
                </p>
              )}
            </div>
          )}

          <Button
            className={`w-full font-bold ${
              paymentMethod === 'khata'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-brand-600 hover:bg-brand-500'
            }`}
            size="lg"
            onClick={handleCheckout}
            disabled={!cart.items.length || checkingOut}
          >
            {checkingOut
              ? 'Processing...'
              : paymentMethod === 'khata'
              ? `Charge to Khata (${formatMoney(cart.afterDiscount)})`
              : `Checkout ${formatMoney(cart.afterDiscount)}`}
          </Button>
        </div>
      </div>

      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        sale={receipt?.sale}
        items={receipt?.items}
        settings={settings}
      />
    </div>
  );
}
