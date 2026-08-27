import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createSale,
  getAllSales,
  getSale,
  getSaleItems,
} from '../controllers/salesController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all sales
router.get('/', getAllSales);

// Get single sale
router.get('/:id', getSale);

// Get sale items
router.get('/:id/items', getSaleItems);

// Create sale
router.post('/', createSale);

export default router;
