import { Router } from 'express';
import { scanInvoice } from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/scan', authenticate, scanInvoice);

export default router;
