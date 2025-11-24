import { Router } from 'express';
import { addCreditTransaction, getCustomerBalance, generateWhatsAppReminder, getAllCustomers, getTrustScore, getCustomerDetails } from '../controllers/credit.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/transaction', authenticate, addCreditTransaction);
router.get('/balance/:customerId', authenticate, getCustomerBalance);
router.post('/remind', authenticate, generateWhatsAppReminder);
router.get('/customers', authenticate, getAllCustomers);
router.get('/:customerId/trust-score', authenticate, getTrustScore);
router.get('/:customerId/details', authenticate, getCustomerDetails);

export default router;
