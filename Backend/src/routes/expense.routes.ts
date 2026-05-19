import express from 'express';
import {
    createExpense,
    listExpenses,
} from '../controllers/expense.controller';
import {
    createExpenseSchema,
    listExpensesSchema,
} from '../validations/expense.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createExpenseSchema), createExpense);
router.get('/', validate(listExpensesSchema), listExpenses);

export default router;
