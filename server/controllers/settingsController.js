import db from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Get business settings
 */
export function getSettings(req, res) {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    
    if (!settings) {
      // Return defaults if no settings exist
      return res.json({
        id: 1,
        business_name: 'MTC Decoration',
        currency: 'PKR',
        tax_rate: 10,
        receipt_footer: 'Thank you for shopping with us!',
        low_stock_threshold: 10,
        preset: 'classic-blue',
      });
    }

    return res.json(settings);
  } catch (error) {
    logger('error', 'Failed to fetch settings', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
}

/**
 * Update business settings
 */
export function updateSettings(req, res) {
  try {
    const {
      business_name,
      currency,
      tax_rate,
      receipt_footer,
      low_stock_threshold,
      preset,
    } = req.body;

    // Validate required fields
    if (!business_name || !currency) {
      return res.status(400).json({ message: 'Business name and currency are required' });
    }

    // Check if settings exist
    const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();

    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE settings 
        SET business_name = ?,
            currency = ?,
            tax_rate = ?,
            receipt_footer = ?,
            low_stock_threshold = ?,
            preset = ?,
            updated_at = datetime('now')
        WHERE id = 1
      `).run(
        business_name,
        currency.toUpperCase(),
        tax_rate || 0,
        receipt_footer || '',
        low_stock_threshold || 10,
        preset || 'classic-blue'
      );
    } else {
      // Insert new settings
      db.prepare(`
        INSERT INTO settings (
          id, business_name, currency, tax_rate, receipt_footer, 
          low_stock_threshold, preset, created_at, updated_at
        )
        VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        business_name,
        currency.toUpperCase(),
        tax_rate || 0,
        receipt_footer || '',
        low_stock_threshold || 10,
        preset || 'classic-blue'
      );
    }

    // Fetch and return updated settings
    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    logger('info', 'Settings updated', { userId: req.user.id });

    return res.json(updated);
  } catch (error) {
    logger('error', 'Failed to update settings', { error: error.message });
    return res.status(500).json({ message: 'Failed to update settings' });
  }
}
