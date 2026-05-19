import express from 'express';
import {
    createSubcategory,
    getSubcategory,
    updateSubcategory,
    toggleSubcategoryStatus,
    listSubcategories,
} from '../controllers/subcategory.controller';
import {
    createSubcategorySchema,
    updateSubcategorySchema,
    getSubcategorySchema,
    listSubcategoriesSchema,
} from '../validations/subcategory.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createSubcategorySchema), createSubcategory);
router.get('/', validate(listSubcategoriesSchema), listSubcategories);
router.get('/:id', validate(getSubcategorySchema), getSubcategory);
router.patch('/:id', validate(updateSubcategorySchema), updateSubcategory);
router.patch('/:id/toggle-status', validate(getSubcategorySchema), toggleSubcategoryStatus);

export default router;