import { Router } from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getSuppliers);
router.post('/', authenticate, createSupplier);
router.put('/:id', authenticate, updateSupplier);
router.delete('/:id', authenticate, deleteSupplier);

export default router;
