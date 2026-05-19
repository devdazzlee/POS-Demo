import express from 'express';
import {
    createUnit,
    getUnit,
    updateUnit,
    listUnits,
    deleteUnit,
} from '../controllers/unit.controller';
import {
    createUnitSchema,
    updateUnitSchema,
    getUnitSchema,
    listUnitsSchema,
} from '../validations/unit.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createUnitSchema), createUnit);
router.get('/', validate(listUnitsSchema), listUnits);
router.get('/:id', validate(getUnitSchema), getUnit);
router.patch('/:id', validate(updateUnitSchema), updateUnit);
router.delete('/:id', validate(getUnitSchema), deleteUnit);

export default router;