import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getSalesSummary,
  getProductPerformance,
  getInventorySummary,
} from '../controllers/reportController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Sales summary
router.get('/sales', getSalesSummary);

// Product performance
router.get('/products', getProductPerformance);

// Inventory summary
router.get('/inventory', getInventorySummary);

export default router;
