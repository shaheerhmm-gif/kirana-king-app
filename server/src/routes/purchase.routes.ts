import { Router } from 'express';
import { createPurchaseOrder, getPurchaseOrders, getPurchaseSuggestions } from '../controllers/purchase.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/orders', authenticate, createPurchaseOrder);
router.get('/orders', authenticate, getPurchaseOrders);
router.get('/suggestions', authenticate, getPurchaseSuggestions);

export default router;
