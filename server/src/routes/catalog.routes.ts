import { Router } from 'express';
import { getCatalog, generateOrderPayload, getImpulseSuggestions } from '../controllers/catalog.controller';

const router = Router();

router.get('/:storeId', getCatalog);
router.post('/order', generateOrderPayload);
router.post('/impulse', getImpulseSuggestions);

export default router;
