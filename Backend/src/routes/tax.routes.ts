import express from 'express';
import {
    createTax,
    getTax,
    updateTax,
    toggletaxestatus,
    listTaxes,
} from '../controllers/tax.controller';
import {
    createtaxeschema,
    updatetaxeschema,
    gettaxeschema,
    listTaxesSchema,
} from '../validations/tax.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createtaxeschema), createTax);
router.get('/', validate(listTaxesSchema), listTaxes);
router.get('/:id', validate(gettaxeschema), getTax);
router.patch('/:id', validate(updatetaxeschema), updateTax);
router.patch('/:id/toggle-status', validate(gettaxeschema), toggletaxestatus);

export default router;