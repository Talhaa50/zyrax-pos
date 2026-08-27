import db from '../config/database.js';
import { logger } from '../utils/logger.js';

// Get sales summary with daily breakdown, expenses, and net profit
export function getSalesSummary(req, res) {
  try {
    const { from, to } = req.query;

    const params = [];
    let where = 'WHERE 1=1';
    let expWhere = 'WHERE 1=1';
    const expParams = [];

    if (from) { 
      where += ' AND DATE(s.created_at) >= ?'; 
      params.push(from); 
      expWhere += ' AND date >= ?';
      expParams.push(from);
    }
    if (to) { 
      where += ' AND DATE(s.created_at) <= ?'; 
      params.push(to); 
      expWhere += ' AND date <= ?';
      expParams.push(to);
    }

    // Overall totals
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(s.total), 0) as total_revenue,
        COALESCE(AVG(s.total), 0) as avg_sale,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts,
        COALESCE(SUM(s.tax_amount), 0) as total_tax
      FROM sales s ${where}
    `).get(...params);

    // Cost of goods sold for sales in period
    const costData = db.prepare(`
      SELECT 
        COALESCE(SUM(si.quantity * si.cost_price), 0) as total_cost
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${where}
    `).get(...params);

    // Total expenses in period
    const expenseData = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses ${expWhere}
    `).get(...expParams);

    // Customer Khata receivables (outstanding balance owed to shop)
    const khataData = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as total_receivable,
        COUNT(CASE WHEN balance > 0 THEN 1 END) as debtors_count
      FROM customers
    `).get();

    const totalRevenue = summary.total_revenue || 0;
    const totalCost = costData.total_cost || 0;
    const grossProfit = totalRevenue - totalCost;
    const totalExpenses = expenseData.total_expenses || 0;
    const netProfit = grossProfit - totalExpenses;

    const enrichedSummary = {
      ...summary,
      total_cost: totalCost,
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      total_receivable: khataData.total_receivable,
      debtors_count: khataData.debtors_count,
    };

    // Daily breakdown
    const daily = db.prepare(`
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as transactions,
        COALESCE(SUM(s.total), 0) as revenue,
        COALESCE(AVG(s.total), 0) as avg_sale
      FROM sales s ${where}
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(...params);

    // Payment method breakdown (Cash, Card, Mobile, Khata)
    const byPayment = db.prepare(`
      SELECT 
        COALESCE(s.payment_method, 'cash') as payment_method,
        COUNT(*) as count,
        COALESCE(SUM(s.total), 0) as total
      FROM sales s ${where}
      GROUP BY s.payment_method
    `).all(...params);

    // Cashier performance
    const byCashier = db.prepare(`
      SELECT 
        u.name as cashier_name,
        COUNT(*) as transactions,
        COALESCE(SUM(s.total), 0) as revenue
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      ${where}
      GROUP BY s.cashier_id
      ORDER BY revenue DESC
    `).all(...params);

    // Expense categories breakdown in this period
    const byExpenseCategory = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM expenses ${expWhere}
      GROUP BY category
      ORDER BY total DESC
    `).all(...expParams);

    res.json({ summary: enrichedSummary, daily, byPayment, byCashier, byExpenseCategory });
  } catch (error) {
    logger('error', 'Get sales summary failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch sales summary' });
  }
}

// Get product performance
export function getProductPerformance(req, res) {
  try {
    const { from, to, limit = 50 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (from) { where += ' AND s.created_at >= ?'; params.push(from); }
    if (to)   { where += ' AND s.created_at <= ?'; params.push(to + ' 23:59:59'); }

    const products = db.prepare(`
      SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity) as units_sold,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        COALESCE(SUM(si.quantity * si.cost_price), 0) as cost,
        COALESCE(SUM(si.subtotal) - SUM(si.quantity * si.cost_price), 0) as profit,
        COUNT(DISTINCT si.sale_id) as transaction_count
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${where}
      GROUP BY si.product_id, si.product_name
      ORDER BY revenue DESC
      LIMIT ?
    `).all(...params, parseInt(limit));

    res.json(products);
  } catch (error) {
    logger('error', 'Get product performance failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch product performance' });
  }
}

// Get inventory summary
export function getInventorySummary(req, res) {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        SUM(quantity) as total_units,
        COALESCE(SUM(quantity * cost_price), 0) as total_cost,
        COALESCE(SUM(quantity * selling_price), 0) as total_retail_value,
        SUM(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
      WHERE archived = 0
    `).get();

    const categories = db.prepare(`
      SELECT 
        COALESCE(category, 'Uncategorised') as category,
        COUNT(*) as products,
        SUM(quantity) as units,
        COALESCE(SUM(quantity * selling_price), 0) as value
      FROM products
      WHERE archived = 0
      GROUP BY category
      ORDER BY value DESC
    `).all();

    res.json({ ...summary, categories });
  } catch (error) {
    logger('error', 'Get inventory summary failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch inventory summary' });
  }
}
