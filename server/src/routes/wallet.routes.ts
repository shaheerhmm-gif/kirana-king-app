import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    getWalletBalance,
    addCredit,
    redeemCredit,
    getWalletHistory,
    getStaleWallets
} from '../controllers/wallet.controller';

const router = Router();

router.get('/:customerId', authenticate, getWalletBalance);
router.post('/credit', authenticate, addCredit);
router.post('/redeem', authenticate, redeemCredit);
router.get('/:customerId/history', authenticate, getWalletHistory);
router.get('/stale/list', authenticate, getStaleWallets);

export default router;
