import db, { applySaleAtomic } from '../config/database.js';
import { logger } from '../utils/logger.js';

// Create sale (direct, no sync queue)
export function createSale(req, res) {
  try {
    const { sale, items } = req.body;

    if (!sale || !sale.id || !items || items.length === 0) {
      return res.status(400).json({ message: 'Invalid sale data' });
    }

    // Enforce cashier_id matches authenticated user
    sale.cashier_id = req.user.id;

    // Execute atomic sale transaction
    const result = applySaleAtomic(sale, items);

    if (result.is_duplicate) {
      logger('warn', 'Duplicate sale prevented', { saleId: sale.id });
      return res.status(200).json({ success: true, duplicate: true, id: sale.id });
    }

    logger('info', 'Sale created', { saleId: sale.id, total: sale.total, userId: req.user.id });

    res.status(201).json({ success: true, id: sale.id });
  } catch (error) {
    logger('error', 'Create sale failed', { error: error.message });
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Failed to create sale' });
  }
}

// Get all sales
export function getAllSales(req, res) {
  try {
    const { cashier_id, from, to, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        s.*,
        u.name as cashier_name,
        COUNT(si.id) as item_count,
        SUM(si.quantity) as total_items
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE 1=1
    `;
    const params = [];

    if (cashier_id) {
      query += ' AND s.cashier_id = ?';
      params.push(cashier_id);
    }

    if (from) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(to);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const sales = db.prepare(query).all(...params);

    res.json(sales);
  } catch (error) {
    logger('error', 'Get sales failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
}

// Get single sale with items
export function getSale(req, res) {
  try {
    const { id } = req.params;

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);

    res.json({ ...sale, items });
  } catch (error) {
    logger('error', 'Get sale failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch sale' });
  }
}

// Get sale items
export function getSaleItems(req, res) {
  try {
    const { id } = req.params;
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
    res.json(items);
  } catch (error) {
    logger('error', 'Get sale items failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch sale items' });
  }
}
