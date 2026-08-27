import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getInventoryLogs,
  adjustInventory,
  getStockLevels,
} from '../controllers/inventoryController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get stock levels
router.get('/stock', getStockLevels);

// Get inventory logs
router.get('/logs', getInventoryLogs);

// Adjust inventory
router.post('/adjust', adjustInventory);

export default router;
