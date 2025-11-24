import { Router } from 'express';
import { getStoreProfile, updateStoreProfile } from '../controllers/store.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', authenticate, getStoreProfile);
router.put('/profile', authenticate, updateStoreProfile);

export default router;
