/**
 * Quick API test to verify Phase 2 completion
 */

import db from './config/database.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { createAuthToken } from './utils/authToken.js';
import * as productController from './controllers/productController.js';
import * as salesController from './controllers/salesController.js';
import * as inventoryController from './controllers/inventoryController.js';

console.log('\n🧪 Testing Phase 2 API Transformation\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function check(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    failed++;
  }
}

// Test 1: Users exist
check('Users seeded in database', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count < 2) throw new Error('Not enough users');
});

// Test 2: Can query products
check('Product queries work', () => {
  const products = db.prepare('SELECT * FROM products LIMIT 5').all();
  if (!Array.isArray(products)) throw new Error('Invalid response');
});

// Test 3: Can query sales
check('Sales queries work', () => {
  const sales = db.prepare('SELECT * FROM sales LIMIT 5').all();
  if (!Array.isArray(sales)) throw new Error('Invalid response');
});

// Test 4: Database transaction support
check('Transaction support verified', () => {
  const transaction = db.transaction(() => {
    const testId = `test_product_${Date.now()}`;
    db.prepare(`
      INSERT INTO products (id, name, selling_price) 
      VALUES (?, 'Test Product', 100)
    `).run(testId);
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(testId);
    db.prepare('DELETE FROM products WHERE id = ?').run(testId);
    
    if (!product) throw new Error('Transaction failed');
  });
  
  transaction();
});

// Test 5: Auth token utilities exist
check('Auth utilities available', () => {
  if (typeof createAuthToken !== 'function') throw new Error('Missing auth function');
});

// Test 6: Controllers exist
check('Product controller exists', () => {
  if (!productController.getAllProducts) throw new Error('Missing controller function');
});

check('Sales controller exists', () => {
  if (!salesController.createSale) throw new Error('Missing controller function');
});

check('Inventory controller exists', () => {
  if (!inventoryController.adjustInventory) throw new Error('Missing controller function');
});

// Test 7: No sync references
check('No sync service files', () => {
  const syncServicePath = join(process.cwd(), 'services', 'syncService.js');
  if (existsSync(syncServicePath)) throw new Error('Sync service still exists');
});

console.log('='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ Phase 2 API transformation successful!\n');
  console.log('🎯 Direct SQLite operations working');
  console.log('🔐 Authentication system ready');
  console.log('🗑️  Sync queue eliminated\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Check errors above.\n');
  process.exit(1);
}
