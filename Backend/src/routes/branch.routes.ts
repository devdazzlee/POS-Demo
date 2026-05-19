import express from 'express';
import {
    createBranch,
    // getBranch,
    updateBranch,
    toggleBranchStatus,
    listBranches,
    getBranchDetails,
    deleteBranch,
} from '../controllers/branch.controller';
import {
    createBranchSchema,
    updateBranchSchema,
    getBranchSchema,
    listBranchesSchema,
} from '../validations/branch.validation';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_MANAGER', 'PURCHASE_MANAGER']));

router.post('/', validate(createBranchSchema), createBranch);
router.get('/', validate(listBranchesSchema), listBranches);
// router.get('/:id', validate(getBranchSchema), getBranch);
router.get('/:id', validate(getBranchSchema), getBranchDetails);
router.patch('/:id', validate(updateBranchSchema), updateBranch);
router.patch('/:id/status', validate(getBranchSchema), toggleBranchStatus);
router.delete('/:id', validate(getBranchSchema), deleteBranch);

export default router;