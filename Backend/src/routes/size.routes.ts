import express from 'express';
import {
    createSize,
    getSize,
    updateSize,
    listSizes,
    deleteSize,
} from '../controllers/size.controller';
import {
    createSizeSchema,
    updateSizeSchema,
    getSizeSchema,
    listSizesSchema,
} from '../validations/size.validation';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createSizeSchema), createSize);
router.get('/', validate(listSizesSchema), listSizes);
router.get('/:id', validate(getSizeSchema), getSize);
router.patch('/:id', validate(updateSizeSchema), updateSize);
router.delete('/:id', validate(getSizeSchema), deleteSize);

export default router;