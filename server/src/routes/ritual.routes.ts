import { Router } from 'express';
import { getNightlyChecks, closeDay } from '../controllers/ritual.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/checks', authenticate, getNightlyChecks);
router.post('/close', authenticate, closeDay);

export default router;
