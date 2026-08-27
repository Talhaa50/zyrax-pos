import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Require auth for expenses
router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
