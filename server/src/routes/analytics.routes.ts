import { Router } from 'express';
import { getDeadStock, getTopItems, getDailySales, getProfitLoss } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dead-stock', authenticate, getDeadStock);
router.get('/top-items', authenticate, getTopItems);
router.get('/daily-sales', authenticate, getDailySales);
router.get('/profit-loss', authenticate, getProfitLoss);

export default router;
