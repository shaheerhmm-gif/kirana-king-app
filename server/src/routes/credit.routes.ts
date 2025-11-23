import { Router } from 'express';
import { addCreditTransaction, getCustomerBalance, generateWhatsAppReminder, getAllCustomers, getTrustScore } from '../controllers/credit.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/transaction', authenticate, addCreditTransaction);
router.get('/balance/:customerId', authenticate, getCustomerBalance);
router.post('/remind', authenticate, generateWhatsAppReminder);
router.get('/customers', authenticate, getAllCustomers);
router.get('/:customerId/trust-score', authenticate, getTrustScore);

export default router;
