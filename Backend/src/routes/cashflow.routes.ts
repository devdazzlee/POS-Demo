import express from 'express';
import {
  createOpening,
  addExpense,
  addClosing,
  getCashFlowByDate,
  listCashFlows,
  getExpensesByDate,
  debugCashFlows,
} from '../controllers/cashflow.controller';
import { prisma } from '../prisma/client';

import {
  createOpeningSchema,
  createExpenseSchema,
  addClosingSchema,
  listCashFlowsSchema,
  getCashFlowByDateSchema,
  getExpensesByDateSchema,
} from '../validations/cashflow.validation';

import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import asyncHandler from '../middleware/asyncHandler';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']));
router.get('/by-date', validate(getCashFlowByDateSchema), getCashFlowByDate);
router.post('/opening', validate(createOpeningSchema), createOpening);
router.post('/expense', validate(createExpenseSchema), addExpense);
router.post('/closing', validate(addClosingSchema), addClosing);
router.get('/', validate(listCashFlowsSchema), listCashFlows);
router.get('/expenses', validate(getExpensesByDateSchema), getExpensesByDate);
router.get('/debug', debugCashFlows);
router.get('/test-create', asyncHandler(async (req, res) => {
  const branchId = req.user?.branch_id;
  if (!branchId) {
    return res.status(400).json({ message: 'Branch not found in request.' });
  }
  
  // Create a test cashflow
  const testCashFlow = await prisma.cashFlow.create({
    data: {
      opening: 100,
      sales: 0,
      closing: null,
      branch_id: branchId,
      status: 'OPEN',
      opened_at: new Date(),
    },
  });
  
  res.json({ 
    success: true, 
    message: 'Test cashflow created', 
    data: testCashFlow 
  });
}));

export default router;
