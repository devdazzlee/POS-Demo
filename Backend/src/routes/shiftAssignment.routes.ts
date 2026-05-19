import express from 'express';
import {
  assignShift,
  getCurrentShift,
  getShiftHistory,
  endCurrentShift,
  getAllShifts,
  updateShift,
  deleteShift,
} from '../controllers/shiftAssignment.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  assignShiftSchema,
  employeeIdParamSchema,
} from '../validations/shiftAssignment.validation';

const router = express.Router();

router.use(authenticate, authorize(['ADMIN', 'SUPER_ADMIN']));

router.post('/', validate(assignShiftSchema), assignShift);
router.get('/current/:employee_id', validate(employeeIdParamSchema), getCurrentShift);
router.get('/history/:employee_id', validate(employeeIdParamSchema), getShiftHistory);
router.patch('/end/:employee_id', validate(employeeIdParamSchema), endCurrentShift);
router.get('/', getAllShifts);
router.patch('/:id', updateShift);
router.delete('/:id', deleteShift);

export default router;
