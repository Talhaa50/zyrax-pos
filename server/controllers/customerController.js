import db from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Get all customers with balances and optional search
 */
export function getCustomers(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];

    if (search && search.trim()) {
      query += ' WHERE name LIKE ? OR phone LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY name ASC';
    const customers = db.prepare(query).all(...params);

    // Summary stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as total_receivable,
        COALESCE(SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END), 0) as total_advance
      FROM customers
    `).get();

    return res.json({ customers, stats });
  } catch (error) {
    logger('error', 'Failed to fetch customers', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch customers' });
  }
}

/**
 * Get single customer with full ledger transaction history
 */
export function getCustomer(req, res) {
  try {
    const { id } = req.params;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transactions = db.prepare(`
      SELECT 
        ct.*,
        u.name as creator_name
      FROM customer_transactions ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.customer_id = ?
      ORDER BY ct.created_at DESC
    `).all(id);

    return res.json({ customer, transactions });
  } catch (error) {
    logger('error', 'Failed to fetch customer ledger', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch customer ledger' });
  }
}

/**
 * Create new customer
 */
export function createCustomer(req, res) {
  try {
    const { name, phone = '', address = '', opening_balance = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const balance = Number(opening_balance) || 0;
    const createdAt = new Date().toISOString();

    const insertCustomerTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO customers (id, name, phone, address, balance, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        name.trim(),
        phone ? phone.trim() : '',
        address ? address.trim() : '',
        balance,
        createdAt,
        createdAt
      );

      // If opening balance > 0, log opening balance debit transaction
      if (balance !== 0) {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const type = balance > 0 ? 'DEBIT' : 'CREDIT';
        db.prepare(`
          INSERT INTO customer_transactions (
            id, customer_id, type, amount, balance_after, reference_id, note, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, 'OPENING', 'Opening Balance', ?, ?)
        `).run(
          txId,
          id,
          type,
          Math.abs(balance),
          balance,
          req.user?.id || null,
          createdAt
        );
      }
    });

    insertCustomerTx();

    logger('info', 'Customer created', { customerId: id, name });

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return res.status(201).json({ success: true, customer: newCustomer });
  } catch (error) {
    logger('error', 'Create customer failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to create customer' });
  }
}

/**
 * Update customer details
 */
export function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { name, phone = '', address = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, address = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name.trim(), phone.trim(), address.trim(), id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return res.json({ success: true, customer: updated });
  } catch (error) {
    logger('error', 'Update customer failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to update customer' });
  }
}

/**
 * Add Khata ledger transaction (Receive Payment or Give Credit)
 */
export function addCustomerTransaction(req, res) {
  try {
    const { id } = req.params;
    const { type, amount, note = '', reference_id = '' } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount greater than 0 is required' });
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({ message: 'Transaction type must be CREDIT or DEBIT' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let newBalance = customer.balance || 0;
    if (type === 'DEBIT') {
      // Gave more credit / customer owes more
      newBalance += numAmount;
    } else {
      // CREDIT: Received payment (wasool) / customer owes less
      newBalance -= numAmount;
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const applyTx = db.transaction(() => {
      // Update customer balance
      db.prepare(`
        UPDATE customers 
        SET balance = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newBalance, id);

      // Insert ledger entry
      db.prepare(`
        INSERT INTO customer_transactions (
          id, customer_id, type, amount, balance_after, reference_id, note, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txId,
        id,
        type,
        numAmount,
        newBalance,
        reference_id || null,
        note.trim() || (type === 'CREDIT' ? 'Payment Received (Wasool)' : 'Credit Given (Udhaar)'),
        req.user?.id || null,
        createdAt
      );
    });

    applyTx();

    logger('info', 'Customer transaction added', { customerId: id, type, amount: numAmount, newBalance });

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    const transactions = db.prepare(`
      SELECT ct.*, u.name as creator_name
      FROM customer_transactions ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.customer_id = ?
      ORDER BY ct.created_at DESC
    `).all(id);

    return res.json({ success: true, customer: updatedCustomer, transactions });
  } catch (error) {
    logger('error', 'Add customer transaction failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to record transaction' });
  }
}

/**
 * Delete customer
 */
export function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    logger('info', 'Customer deleted', { customerId: id, name: customer.name });

    return res.json({ success: true, message: `Customer ${customer.name} deleted successfully` });
  } catch (error) {
    logger('error', 'Delete customer failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete customer' });
  }
}
