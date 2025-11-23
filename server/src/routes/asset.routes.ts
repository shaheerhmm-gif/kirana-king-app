import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    getAssetTypes,
    createAssetType,
    giveAsset,
    returnAsset,
    getPendingAssets,
    getOverdueAssets
} from '../controllers/asset.controller';

const router = Router();

router.get('/types', authenticate, getAssetTypes);
router.post('/types', authenticate, createAssetType);
router.post('/give', authenticate, giveAsset);
router.post('/return', authenticate, returnAsset);
router.get('/pending/:customerId', authenticate, getPendingAssets);
router.get('/overdue', authenticate, getOverdueAssets);

export default router;
