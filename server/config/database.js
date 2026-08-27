import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'pos_data.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
export function initializeSchema() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      password_hash TEXT,
      password_salt TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT,
      barcode TEXT,
      category TEXT,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 0,
      image_id TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  // Customers (Khata accounts) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `);

  // Customer transactions (Khata ledger history) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'DEBIT' (gave credit/took goods) or 'CREDIT' (received payment/wasool)
      amount REAL NOT NULL,
      balance_after REAL DEFAULT 0,
      reference_id TEXT,
      note TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cust_tx_customer ON customer_transactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_cust_tx_created ON customer_transactions(created_at);
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      payment_method TEXT DEFAULT 'cash',
      date TEXT NOT NULL DEFAULT (date('now')),
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      cashier_id TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT,
      idempotency_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Safely add customer_id and customer_name if table already existed without them
  try {
    const tableInfo = db.prepare("PRAGMA table_info(sales)").all();
    const hasCustId = tableInfo.some((col) => col.name === 'customer_id');
    const hasCustName = tableInfo.some((col) => col.name === 'customer_name');
    if (!hasCustId) {
      db.exec('ALTER TABLE sales ADD COLUMN customer_id TEXT');
    }
    if (!hasCustName) {
      db.exec('ALTER TABLE sales ADD COLUMN customer_name TEXT');
    }
  } catch (err) {
    console.log('[SQLite] Sales table columns checked');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sales_idempotency ON sales(idempotency_key);
  `);

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
  `);

  // Inventory logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      reason TEXT,
      actor_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_inventory_logs_reference ON inventory_logs(reference_type, reference_id);
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_id TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at);
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT 'MTC Decoration',
      currency TEXT NOT NULL DEFAULT 'PKR',
      tax_rate REAL DEFAULT 10,
      receipt_footer TEXT DEFAULT 'Thank you for shopping with us!',
      low_stock_threshold INTEGER DEFAULT 10,
      preset TEXT DEFAULT 'classic-blue',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Insert default settings if not exists
  const settingsExists = db.prepare('SELECT COUNT(*) as count FROM settings WHERE id = 1').get();
  if (settingsExists.count === 0) {
    db.prepare(`
      INSERT INTO settings (id, business_name, currency, tax_rate, receipt_footer, low_stock_threshold, preset)
      VALUES (1, 'MTC Decoration', 'PKR', 10, 'Thank you for shopping with us!', 10, 'classic-blue')
    `).run();
  }

  console.log('[SQLite] Database schema initialized successfully');
  console.log(`[SQLite] Database location: ${dbPath}`);
}

/**
 * Apply atomic sale transaction
 */
export function applySaleAtomic(saleData, items) {
  const applyTransaction = db.transaction((sale, saleItems) => {
    // Check if sale already exists (idempotency)
    const existing = db.prepare('SELECT id FROM sales WHERE id = ?').get(sale.id);
    if (existing) {
      return { ok: true, is_duplicate: true };
    }

    // Insert sale
    const insertSale = db.prepare(`
      INSERT INTO sales (
        id, invoice_number, cashier_id, customer_id, customer_name,
        subtotal, discount, discount_amount, tax_rate, tax_amount, total, 
        payment_method, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSale.run(
      sale.id,
      sale.invoice_number,
      sale.cashier_id,
      sale.customer_id || null,
      sale.customer_name || null,
      sale.subtotal || 0,
      sale.discount || 0,
      sale.discount_amount || 0,
      sale.tax_rate || 0,
      sale.tax_amount || 0,
      sale.total || 0,
      sale.payment_method || 'cash',
      sale.idempotency_key || null,
      sale.created_at || new Date().toISOString()
    );

    // If payment method is Khata / Credit, update customer balance and ledger
    if (sale.payment_method === 'khata' && sale.customer_id) {
      const customer = db.prepare('SELECT id, name, balance FROM customers WHERE id = ?').get(sale.customer_id);
      if (customer) {
        const newBalance = (customer.balance || 0) + Number(sale.total);
        db.prepare("UPDATE customers SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(
          newBalance,
          sale.customer_id
        );

        // Record customer Khata ledger transaction
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.prepare(`
          INSERT INTO customer_transactions (
            id, customer_id, type, amount, balance_after, reference_id, note, created_by, created_at
          ) VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, ?, ?)
        `).run(
          txId,
          sale.customer_id,
          Number(sale.total),
          newBalance,
          sale.invoice_number,
          `Invoice #${sale.invoice_number} (POS Sale)`,
          sale.cashier_id,
          sale.created_at || new Date().toISOString()
        );
      }
    }

    // Process each sale item
    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price, cost_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateProductStock = db.prepare(`
      UPDATE products 
      SET quantity = quantity - ?, updated_at = datetime('now')
      WHERE id = ? AND archived = 0
    `);

    const getProduct = db.prepare(`
      SELECT id, name, quantity FROM products WHERE id = ? AND archived = 0
    `);

    const insertInventoryLog = db.prepare(`
      INSERT INTO inventory_logs (id, product_id, type, quantity, reference_id, reference_type, created_at)
      VALUES (?, ?, 'SALE', ?, ?, 'sale', ?)
    `);

    for (const item of saleItems) {
      const product = getProduct.get(item.product_id);
      
      if (!product) {
        throw new Error(`Product ${item.product_id} is unavailable`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, requested: ${item.quantity}`
        );
      }

      // Insert sale item
      insertSaleItem.run(
        item.id,
        sale.id,
        item.product_id,
        item.product_name || product.name,
        item.quantity,
        item.price,
        item.cost_price || 0,
        item.subtotal
      );

      // Update product stock
      updateProductStock.run(item.quantity, item.product_id);

      // Log inventory movement
      insertInventoryLog.run(
        `sale_${sale.id}_${item.product_id}`,
        item.product_id,
        -item.quantity,
        sale.id,
        sale.created_at || new Date().toISOString()
      );
    }

    // Create audit log
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
      VALUES (?, 'CREATE_SALE', 'sale', ?, ?, ?, ?)
    `);

    insertAudit.run(
      `sale_${sale.id}`,
      sale.id,
      sale.cashier_id,
      JSON.stringify({
        invoice_number: sale.invoice_number,
        total: sale.total,
        payment_method: sale.payment_method,
        customer_id: sale.customer_id,
        item_count: saleItems.length
      }),
      sale.created_at || new Date().toISOString()
    );

    return { ok: true, is_duplicate: false, sale_id: sale.id };
  });

  return applyTransaction(saleData, items);
}

/**
 * Get database instance
 */
export function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  db.close();
  console.log('[SQLite] Database connection closed');
}

// Initialize schema on module load
initializeSchema();

export default db;
