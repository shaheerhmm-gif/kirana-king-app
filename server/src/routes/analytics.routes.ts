import { Router } from 'express';
import { getDeadStock, getTopItems, getDailySales, getProfitLoss, getSalesAnalytics, getStockValuation, getGSTRegister, getSlowMovingItems, getItemWiseMargin } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dead-stock', authenticate, getDeadStock);
router.get('/top-items', authenticate, getTopItems);
router.get('/daily-sales', authenticate, getDailySales);
router.get('/profit-loss', authenticate, getProfitLoss);
router.get('/sales-analytics', authenticate, getSalesAnalytics);
router.get('/stock-valuation', authenticate, getStockValuation);
router.get('/gst-register', authenticate, getGSTRegister);
router.get('/slow-moving', authenticate, getSlowMovingItems);
router.get('/item-margin', authenticate, getItemWiseMargin);

export default router;
