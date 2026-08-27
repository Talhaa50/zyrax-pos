#!/usr/bin/env node

/**
 * Simple SQLite Database Viewer
 * Run from root: node view-database.js
 * OR from server: cd server && node ../view-database.js
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';

let dbPath = join(process.cwd(), 'server', 'data', 'pos_data.db');

// If running from server directory
if (!existsSync(dbPath)) {
  dbPath = join(process.cwd(), 'data', 'pos_data.db');
}

// Still not found?
if (!existsSync(dbPath)) {
  console.error('❌ Database not found!');
  console.error('   Tried:', join(process.cwd(), 'server', 'data', 'pos_data.db'));
  console.error('   And:', join(process.cwd(), 'data', 'pos_data.db'));
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

console.log('\n🗄️  ZYRAX POS DATABASE VIEWER');
console.log('================================\n');

// Products
console.log('📦 PRODUCTS:');
console.log('--------------------------------');
const products = db.prepare(`
  SELECT id, name, sku, barcode, category, cost_price, selling_price, quantity, archived
  FROM products
  ORDER BY created_at DESC
`).all();
console.table(products);

// Sales
console.log('\n💰 SALES:');
console.log('--------------------------------');
const sales = db.prepare(`
  SELECT id, invoice_number, cashier_id, total, payment_method, 
         datetime(created_at, 'localtime') as sale_date
  FROM sales
  ORDER BY created_at DESC
  LIMIT 10
`).all();
console.table(sales);

// Users
console.log('\n👥 USERS:');
console.log('--------------------------------');
const users = db.prepare(`
  SELECT id, name, email, role, active
  FROM users
`).all();
console.table(users);

// Settings
console.log('\n⚙️  SETTINGS:');
console.log('--------------------------------');
const settings = db.prepare(`
  SELECT business_name, currency, tax_rate, low_stock_threshold, preset
  FROM settings
  WHERE id = 1
`).get();
console.table([settings]);

// Inventory Summary
console.log('\n📊 INVENTORY SUMMARY:');
console.log('--------------------------------');
const summary = db.prepare(`
  SELECT 
    COUNT(*) as total_products,
    SUM(CASE WHEN archived = 0 THEN 1 ELSE 0 END) as active_products,
    SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) as archived_products,
    SUM(CASE WHEN quantity <= reorder_level AND archived = 0 THEN 1 ELSE 0 END) as low_stock,
    SUM(CASE WHEN quantity = 0 AND archived = 0 THEN 1 ELSE 0 END) as out_of_stock,
    SUM(quantity) as total_units,
    ROUND(SUM(quantity * cost_price), 2) as inventory_cost,
    ROUND(SUM(quantity * selling_price), 2) as inventory_value
  FROM products
`).get();
console.table([summary]);

// Recent Inventory Logs
console.log('\n📝 RECENT INVENTORY CHANGES:');
console.log('--------------------------------');
const logs = db.prepare(`
  SELECT 
    l.type,
    p.name as product,
    l.quantity,
    l.reason,
    datetime(l.created_at, 'localtime') as changed_at
  FROM inventory_logs l
  JOIN products p ON l.product_id = p.id
  ORDER BY l.created_at DESC
  LIMIT 10
`).all();
console.table(logs);

db.close();

console.log('\n✅ Database location:', dbPath);
console.log('');
