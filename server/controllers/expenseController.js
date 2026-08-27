import db from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Get all expenses with filtering and summary metrics
 */
export function getExpenses(req, res) {
  try {
    const { from, to, category, search, limit = 200 } = req.query;

    let query = `
      SELECT 
        e.*,
        u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      query += ' AND e.date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND e.date <= ?';
      params.push(to);
    }
    if (category && category !== 'all') {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (search && search.trim()) {
      query += ' AND e.description LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const expenses = db.prepare(query).all(...params);

    // Filter params for summary totals in the current selected range
    let summaryWhere = 'WHERE 1=1';
    const summaryParams = [];
    if (from) {
      summaryWhere += ' AND date >= ?';
      summaryParams.push(from);
    }
    if (to) {
      summaryWhere += ' AND date <= ?';
      summaryParams.push(to);
    }

    const rangeSummary = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses ${summaryWhere}
    `).get(...summaryParams);

    // Today & Month summaries
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const todayTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?').get(today);
    const monthTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ?').get(firstOfMonth);

    // Breakdown by category
    const byCategory = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM expenses ${summaryWhere}
      GROUP BY category
      ORDER BY total DESC
    `).all(...summaryParams);

    return res.json({
      expenses,
      summary: {
        total: rangeSummary.total_amount,
        count: rangeSummary.count,
        today: todayTotal.total,
        thisMonth: monthTotal.total,
        byCategory,
      },
    });
  } catch (error) {
    logger('error', 'Failed to fetch expenses', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch expenses' });
  }
}

/**
 * Create new expense
 */
export function createExpense(req, res) {
  try {
    const { description, amount, category = 'General', payment_method = 'cash', date } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expenseDate = date || new Date().toISOString().slice(0, 10);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO expenses (id, description, amount, category, payment_method, date, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      description.trim(),
      numAmount,
      category,
      payment_method,
      expenseDate,
      req.user?.id || null,
      createdAt
    );

    logger('info', 'Expense recorded', { expenseId: id, description, amount: numAmount, category });

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    return res.status(201).json({ success: true, expense: newExpense, message: 'Expense added successfully' });
  } catch (error) {
    logger('error', 'Create expense failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to create expense' });
  }
}

/**
 * Delete expense
 */
export function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    logger('info', 'Expense deleted', { expenseId: id });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    logger('error', 'Delete expense failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete expense' });
  }
}
