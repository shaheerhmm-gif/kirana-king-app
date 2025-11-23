import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    createSupplier,
    getSuppliers,
    createInvoice,
    getInvoices,
    getCreditProfile,
    recordPayment
} from '../controllers/supplier.controller';

const router = Router();

router.get('/', authenticate, getSuppliers);
router.post('/', authenticate, createSupplier);
router.get('/invoices', authenticate, getInvoices);
router.post('/invoices', authenticate, createInvoice);
router.post('/payments', authenticate, recordPayment);
router.get('/credit-profile', authenticate, getCreditProfile);

export default router;
