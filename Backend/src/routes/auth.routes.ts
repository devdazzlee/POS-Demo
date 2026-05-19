import express from 'express';
import { getCurrentUser, login, logout, register, registerAdmin } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
// Register endpoint for admins
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));
router.post('/register/admin', validate(registerSchema), registerAdmin);
router.get('/me', getCurrentUser);

export default router;
