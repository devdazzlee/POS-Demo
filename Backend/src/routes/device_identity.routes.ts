import express from 'express';
import { addDeviceIdentity } from '../controllers/device_identity.controller';
import { validate } from '../middleware/validation.middleware';
import { deviceIdentitySchema } from '../validations/device_identity.validation';

const router = express.Router();

router.post('/', validate(deviceIdentitySchema), addDeviceIdentity);

export default router;