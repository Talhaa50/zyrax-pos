import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  addCustomerTransaction,
  deleteCustomer,
} from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Require auth for Khata routes
router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.post('/:id/transaction', addCustomerTransaction);
router.delete('/:id', deleteCustomer);

export default router;
