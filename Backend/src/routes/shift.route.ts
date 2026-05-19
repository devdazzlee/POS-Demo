import express from 'express';
import { createShift, listShifts } from '../controllers/shift.controller';
import { createShiftSchema, listShiftsSchema } from '../validations/shift.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { updateShift, deleteShift } from '../controllers/shift.controller';
import { shiftIdParamSchema } from '../validations/shift.validation';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createShiftSchema), createShift);
router.get('/', validate(listShiftsSchema), listShifts);
router.put('/:id', validate(shiftIdParamSchema), updateShift);
router.delete('/:id', validate(shiftIdParamSchema), deleteShift);

export default router;
