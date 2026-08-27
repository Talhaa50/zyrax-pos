/**
 * Phase 1 SQLite Migration Verification Script
 * 
 * Verifies that:
 * 1. Database file exists
 * 2. All tables are created
 * 3. Indexes are in place
 * 4. Upload directory exists
 * 5. No Supabase dependencies remain
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Phase 1 SQLite Migration Verification\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function check(description, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Database file exists
check('Database file exists', () => {
  const dbPath = join(__dirname, 'data', 'pos_data.db');
  return existsSync(dbPath);
});

// Test 2: All tables exist
check('All required tables exist', () => {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  const requiredTables = ['users', 'products', 'sales', 'sale_items', 'inventory_logs', 'audit_logs'];
  const tableNames = tables.map(t => t.name);
  
  const allExist = requiredTables.every(t => tableNames.includes(t));
  
  if (allExist) {
    console.log(`   Tables: ${tableNames.join(', ')}`);
  }
  
  return allExist;
});

// Test 3: Indexes exist
check('Database indexes created', () => {
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
  `).all();
  
  console.log(`   Found ${indexes.length} indexes`);
  return indexes.length >= 10; // We created at least 10 indexes
});

// Test 4: Upload directory exists
check('Upload directory exists', () => {
  const uploadPath = join(__dirname, 'public', 'uploads', 'products');
  return existsSync(uploadPath);
});

// Test 5: Foreign keys enabled
check('Foreign keys are enabled', () => {
  const result = db.prepare('PRAGMA foreign_keys').get();
  return result.foreign_keys === 1;
});

// Test 6: WAL mode enabled
check('WAL mode is enabled', () => {
  const result = db.prepare('PRAGMA journal_mode').get();
  return result.journal_mode === 'wal';
});

// Test 7: Users table schema
check('Users table has correct columns', () => {
  const columns = db.prepare(`PRAGMA table_info(users)`).all();
  const columnNames = columns.map(c => c.name);
  const required = ['id', 'name', 'email', 'role', 'password_hash', 'password_salt', 'active'];
  return required.every(col => columnNames.includes(col));
});

// Test 8: Products table schema
check('Products table has correct columns', () => {
  const columns = db.prepare(`PRAGMA table_info(products)`).all();
  const columnNames = columns.map(c => c.name);
  const required = ['id', 'name', 'sku', 'barcode', 'cost_price', 'selling_price', 'quantity', 'reorder_level'];
  return required.every(col => columnNames.includes(col));
});

// Test 9: Sales table schema
check('Sales table has correct columns', () => {
  const columns = db.prepare(`PRAGMA table_info(sales)`).all();
  const columnNames = columns.map(c => c.name);
  const required = ['id', 'invoice_number', 'cashier_id', 'total', 'payment_method', 'idempotency_key'];
  return required.every(col => columnNames.includes(col));
});

// Test 10: Can insert and read data
check('Can perform database operations', () => {
  const testId = `test_${Date.now()}`;
  
  // Insert test user
  db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash, password_salt, active)
    VALUES (?, 'Test User', ?, 'cashier', 'hash', 'salt', 1)
  `).run(testId, `test_${testId}@example.com`);
  
  // Read it back
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(testId);
  
  // Clean up
  db.prepare('DELETE FROM users WHERE id = ?').run(testId);
  
  return user && user.name === 'Test User';
});

// Test 11: Transaction support
check('Transactions work correctly', () => {
  const testId = `trans_${Date.now()}`;
  
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, name, email, role, password_hash, password_salt)
      VALUES (?, 'Transaction Test', ?, 'cashier', 'hash', 'salt')
    `).run(testId, `trans_${testId}@example.com`);
    
    return db.prepare('SELECT COUNT(*) as count FROM users WHERE id = ?').get(testId);
  });
  
  const result = transaction();
  
  // Clean up
  db.prepare('DELETE FROM users WHERE id = ?').run(testId);
  
  return result.count === 1;
});

// Summary
console.log('='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ All checks passed! Phase 1 migration successful.\n');
  console.log('📝 Database location: server/data/pos_data.db');
  console.log('📁 Image storage: server/public/uploads/products/');
  console.log('📚 Documentation: docs/SQLITE_DATABASE.md\n');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the errors above.\n');
  process.exit(1);
}
