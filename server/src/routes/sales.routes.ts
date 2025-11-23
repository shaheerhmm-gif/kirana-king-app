import { Router } from 'express';
import { createSale, getDailySales, getProductLedger } from '../controllers/sales.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createSale);
router.get('/daily', authenticate, getDailySales);
router.get('/ledger/:productId', authenticate, getProductLedger);

export default router;
