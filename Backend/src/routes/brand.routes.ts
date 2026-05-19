import express from 'express';
import {
    createBrand,
    getBrand,
    updateBrand,
    toggleBrandDisplay,
    listBrands,
    deleteBrand,
} from '../controllers/brand.controller';
import {
    createBrandSchema,
    updateBrandSchema,
    getBrandSchema,
    listBrandsSchema,
} from '../validations/brand.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();
router.post('/', authenticate, validate(createBrandSchema), createBrand);

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.get('/', validate(listBrandsSchema), listBrands);
router.get('/:id', validate(getBrandSchema), getBrand);
router.patch('/:id', validate(updateBrandSchema), updateBrand);
router.delete('/:id', validate(getBrandSchema), deleteBrand);
router.patch('/:id/toggle-display', validate(getBrandSchema), toggleBrandDisplay);

export default router;