import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    parkBill,
    getParkedBills,
    resumeParkedBill,
    deleteParkedBill,
    updateParkedBill
} from '../controllers/parked.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Park a new bill
router.post('/', parkBill);

// Get all parked bills
router.get('/', getParkedBills);

// Resume a specific parked bill
router.get('/:id', resumeParkedBill);

// Update a parked bill
router.put('/:id', updateParkedBill);

// Delete a parked bill
router.delete('/:id', deleteParkedBill);

export default router;
