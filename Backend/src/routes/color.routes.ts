import express from 'express';
import {
    createColor,
    getColor,
    updateColor,
    listColors,
    deleteColor,
} from '../controllers/color.controller';
import {
    createColorSchema,
    updateColorSchema,
    getColorSchema,
    listColorsSchema,
} from '../validations/color.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createColorSchema), createColor);
router.get('/', validate(listColorsSchema), listColors);
router.get('/:id', validate(getColorSchema), getColor);
router.patch('/:id', validate(updateColorSchema), updateColor);
router.delete('/:id', validate(getColorSchema), deleteColor);

export default router;