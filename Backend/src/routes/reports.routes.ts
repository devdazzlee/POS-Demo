import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getReportsData } from '../controllers/reports.controller';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.get('/', getReportsData);

export default router;

