import { Router } from 'express';
import { createSupplierReturn, getSupplierReturns } from '../controllers/supplierReturn.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createSupplierReturn);
router.get('/', authenticate, getSupplierReturns);

export default router;
