import { Router } from 'express';
import { logInventoryVoice, getExpiryAlerts, getLowStock, adjustStock, updateBatch } from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/log-voice', authenticate, logInventoryVoice);
router.get('/expiry-alerts', authenticate, getExpiryAlerts);
router.get('/low-stock', authenticate, getLowStock);
router.post('/adjust', authenticate, adjustStock);
router.put('/batch/:id', authenticate, updateBatch);

export default router;
