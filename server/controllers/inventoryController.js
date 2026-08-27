import db from '../config/database.js';
import { logger } from '../utils/logger.js';

// Get inventory logs
export function getInventoryLogs(req, res) {
  try {
    const { product_id, type, limit = 100 } = req.query;

    let query = 'SELECT * FROM inventory_logs WHERE 1=1';
    const params = [];

    if (product_id) {
      query += ' AND product_id = ?';
      params.push(product_id);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const logs = db.prepare(query).all(...params);

    res.json(logs);
  } catch (error) {
    logger('error', 'Get inventory logs failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch inventory logs' });
  }
}

// Adjust inventory (add/remove stock)
export function adjustInventory(req, res) {
  try {
    const { product_id, type, quantity, reason } = req.body;

    if (!product_id || !type || quantity === undefined) {
      return res.status(400).json({ message: 'Missing required fields: product_id, type, quantity' });
    }

    // Verify product exists
    const product = db.prepare('SELECT id, quantity FROM products WHERE id = ?').get(product_id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const logId = `inv_${Date.now()}_${product_id}`;

    // Insert inventory log
    db.prepare(`
      INSERT INTO inventory_logs (id, product_id, type, quantity, reason, actor_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(logId, product_id, type, quantity, reason || null, req.user.id);

    // Update product quantity
    db.prepare(`
      UPDATE products 
      SET quantity = quantity + ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(quantity, product_id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
      VALUES (?, 'INVENTORY_ADJUST', 'inventory', ?, ?, ?, datetime('now'))
    `).run(
      `inv_audit_${Date.now()}`,
      product_id,
      req.user.id,
      JSON.stringify({ type, quantity, reason })
    );

    logger('info', 'Inventory adjusted', { 
      productId: product_id, 
      type, 
      quantity, 
      userId: req.user.id 
    });

    res.json({ success: true, logId });
  } catch (error) {
    logger('error', 'Adjust inventory failed', { error: error.message });
    res.status(500).json({ message: 'Failed to adjust inventory' });
  }
}

// Get current stock levels
export function getStockLevels(req, res) {
  try {
    const { lowStock } = req.query;

    let query = 'SELECT id, name, sku, quantity, reorder_level, category FROM products WHERE archived = 0';

    if (lowStock === 'true') {
      query += ' AND quantity <= reorder_level';
    }

    query += ' ORDER BY quantity ASC';

    const products = db.prepare(query).all();

    res.json(products);
  } catch (error) {
    logger('error', 'Get stock levels failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch stock levels' });
  }
}
