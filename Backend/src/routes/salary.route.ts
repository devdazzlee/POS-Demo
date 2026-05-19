import express from 'express';
import { createSalary, deleteSalary, listSalaries, updateSalary } from '../controllers/salary.controller';
import { createSalarySchema, listSalariesSchema, salaryIdParamSchema } from '../validations/salary.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/', validate(createSalarySchema), createSalary);
router.get('/', validate(listSalariesSchema), listSalaries);
router.put('/:id', validate(salaryIdParamSchema), updateSalary); 
router.delete('/:id', validate(salaryIdParamSchema), deleteSalary); 

export default router;
