import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getBranches, createBranch, getGodowns, createGodown } from '../controllers/branch.controller';

const router = Router();

router.get('/', authenticate, getBranches);
router.post('/', authenticate, createBranch);
router.get('/:branchId/godowns', authenticate, getGodowns);
router.post('/:branchId/godowns', authenticate, createGodown);

export default router;
