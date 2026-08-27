/**
 * Seed database with default admin and cashier users
 */

import crypto from 'node:crypto';
import db from './config/database.js';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt,
      });
    });
  });
}

async function seedUsers() {
  console.log('\n🌱 Seeding database with default users...\n');

  // Check if users already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (existing.count > 0) {
    console.log('⚠️  Users already exist. Skipping seed.');
    console.log(`   Current user count: ${existing.count}`);
    return;
  }

  // Create admin user
  const adminPassword = process.env.RETAILER_ADMIN_PASSWORD || 'admin123';
  const adminCreds = await hashPassword(adminPassword);

  db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash, password_salt, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
  `).run(
    'admin_1',
    'Admin User',
    'admin@retailer.com',
    'admin',
    adminCreds.hash,
    adminCreds.salt
  );

  console.log('✅ Admin user created');
  console.log('   Email: admin@retailer.com');
  console.log(`   Password: ${adminPassword}`);

  // Create cashier user
  const cashierPassword = process.env.RETAILER_CASHIER_PASSWORD || 'cashier123';
  const cashierCreds = await hashPassword(cashierPassword);

  db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash, password_salt, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
  `).run(
    'cashier_1',
    'Cashier User',
    'cashier@retailer.com',
    'cashier',
    cashierCreds.hash,
    cashierCreds.salt
  );

  console.log('✅ Cashier user created');
  console.log('   Email: cashier@retailer.com');
  console.log(`   Password: ${cashierPassword}`);

  console.log('\n✅ Database seeded successfully!\n');
}

// Run seed
seedUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  });
