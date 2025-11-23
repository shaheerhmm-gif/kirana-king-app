import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    getLooseItems,
    updateLooseLevel,
    getConsumptionStats,
    getReorderSuggestions,
    configureLooseItem
} from '../controllers/loose.controller';

const router = Router();

router.get('/', authenticate, getLooseItems);
router.put('/:id/level', authenticate, updateLooseLevel);
router.get('/:id/stats', authenticate, getConsumptionStats);
router.get('/reorder/suggestions', authenticate, getReorderSuggestions);
router.post('/configure', authenticate, configureLooseItem);

export default router;
