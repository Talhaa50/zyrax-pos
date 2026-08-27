import db from '../config/database.js';
import { logger } from '../utils/logger.js';

// Get all products
export function getAllProducts(req, res) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    
    const query = includeArchived
      ? 'SELECT * FROM products ORDER BY name ASC'
      : 'SELECT * FROM products WHERE archived = 0 ORDER BY name ASC';
    
    const products = db.prepare(query).all();
    
    res.json(products);
  } catch (error) {
    logger('error', 'Get products failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

// Get single product
export function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    logger('error', 'Get product failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

// Create product
export function createProduct(req, res) {
  try {
    const product = req.body;
    
    if (!product.id || !product.name || !product.selling_price) {
      return res.status(400).json({ message: 'Missing required fields: id, name, selling_price' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, sku, barcode, category, cost_price, selling_price,
        quantity, reorder_level, image_id, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      product.id,
      product.name,
      product.sku || null,
      product.barcode || null,
      product.category || null,
      product.cost_price || 0,
      product.selling_price,
      product.quantity || 0,
      product.reorder_level || 10,
      product.image_id || null,
      product.archived ? 1 : 0
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
      VALUES (?, 'CREATE_PRODUCT', 'product', ?, ?, ?, datetime('now'))
    `).run(
      `product_${product.id}_${Date.now()}`,
      product.id,
      req.user.id,
      JSON.stringify({ name: product.name })
    );

    logger('info', 'Product created', { productId: product.id, userId: req.user.id });
    
    res.status(201).json({ success: true, id: product.id });
  } catch (error) {
    logger('error', 'Create product failed', { error: error.message });
    res.status(500).json({ message: 'Failed to create product' });
  }
}

// Update product
export function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const product = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const stmt = db.prepare(`
      UPDATE products SET
        name = ?, sku = ?, barcode = ?, category = ?,
        cost_price = ?, selling_price = ?, quantity = ?,
        reorder_level = ?, image_id = ?, archived = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      product.name,
      product.sku || null,
      product.barcode || null,
      product.category || null,
      product.cost_price || 0,
      product.selling_price,
      product.quantity !== undefined ? product.quantity : 0,
      product.reorder_level || 10,
      product.image_id || null,
      product.archived ? 1 : 0,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
      VALUES (?, 'UPDATE_PRODUCT', 'product', ?, ?, ?, datetime('now'))
    `).run(
      `product_${id}_${Date.now()}`,
      id,
      req.user.id,
      JSON.stringify({ name: product.name })
    );

    logger('info', 'Product updated', { productId: id, userId: req.user.id });

    res.json({ success: true, id });
  } catch (error) {
    logger('error', 'Update product failed', { error: error.message });
    res.status(500).json({ message: 'Failed to update product' });
  }
}

// Archive product (soft delete)
export function archiveProduct(req, res) {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    db.prepare(`
      UPDATE products SET archived = 1, updated_at = datetime('now') WHERE id = ?
    `).run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, created_at)
      VALUES (?, 'ARCHIVE_PRODUCT', 'product', ?, ?, datetime('now'))
    `).run(
      `product_${id}_${Date.now()}`,
      id,
      req.user.id
    );

    logger('info', 'Product archived', { productId: id, userId: req.user.id });

    res.json({ success: true, id });
  } catch (error) {
    logger('error', 'Archive product failed', { error: error.message });
    res.status(500).json({ message: 'Failed to archive product' });
  }
}

// Search products
export function searchProducts(req, res) {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const products = db.prepare(`
      SELECT * FROM products
      WHERE archived = 0
        AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
      ORDER BY name ASC
      LIMIT 50
    `).all(searchTerm, searchTerm, searchTerm);

    res.json(products);
  } catch (error) {
    logger('error', 'Search products failed', { error: error.message });
    res.status(500).json({ message: 'Failed to search products' });
  }
}
