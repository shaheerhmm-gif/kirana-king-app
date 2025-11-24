import { Router } from 'express';
import { logInventoryVoice, getExpiryAlerts, getLowStock, adjustStock, updateBatch, getProducts, createProduct, updateProduct, deleteProduct, getPublicProducts } from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/log-voice', authenticate, logInventoryVoice);
router.get('/expiry-alerts', authenticate, getExpiryAlerts);
router.get('/low-stock', authenticate, getLowStock);
router.post('/adjust', authenticate, adjustStock);
router.put('/batch/:id', authenticate, updateBatch);
router.get('/products', authenticate, getProducts);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);

router.get('/public/:storeId', getPublicProducts);

export default router;
