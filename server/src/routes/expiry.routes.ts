import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getExpiringItems, moveToDiscount } from '../controllers/expiry.controller';

const router = Router();

router.get('/items', authenticate, getExpiringItems);
router.put('/:id/discount', authenticate, moveToDiscount);

export default router;
