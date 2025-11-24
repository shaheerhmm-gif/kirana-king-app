import { Router } from 'express';
import { getLedgers, createLedger, getDayBook, exportTally, closeFinancialYear } from '../controllers/accounting.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/ledgers', authenticate, getLedgers);
router.post('/ledgers', authenticate, createLedger);
router.get('/daybook', authenticate, getDayBook);
router.get('/export/tally', authenticate, exportTally);
router.post('/close-year', authenticate, closeFinancialYear);

export default router;
