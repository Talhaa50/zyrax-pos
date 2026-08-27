import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All settings routes require authentication
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
