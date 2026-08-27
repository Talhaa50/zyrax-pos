import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  searchProducts,
} from '../controllers/productController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Search products
router.get('/search', searchProducts);

// Get all products
router.get('/', getAllProducts);

// Get single product
router.get('/:id', getProduct);

// Create product (admin only)
router.post('/', requireRole('admin'), createProduct);

// Update product (admin only)
router.put('/:id', requireRole('admin'), updateProduct);

// Archive product (admin only)
router.delete('/:id', requireRole('admin'), archiveProduct);

export default router;
