import { Router } from 'express';
import { 
  changePassword, 
  getProfile, 
  updateProfile,
  getAllUsers,
  createUser,
  updateUser,
  setUserPassword,
  deleteUser
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Profile routes (any logged-in user)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

// Admin-only user management routes
router.get('/', requireAdmin, getAllUsers);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.post('/:id/password', requireAdmin, setUserPassword);
router.delete('/:id', requireAdmin, deleteUser);

export default router;
