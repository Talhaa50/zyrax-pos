import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadProductImage, deleteProductImage } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Require authentication for all upload routes
router.use(authMiddleware);

// Upload product image
router.post('/products', upload.single('image'), uploadProductImage);

// Delete product image
router.delete('/products/:filename', deleteProductImage);

export default router;
