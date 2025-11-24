import { Router } from 'express';
import authRoutes from './auth.routes';
import inventoryRoutes from './inventory.routes';
import invoiceRoutes from './invoice.routes';
import creditRoutes from './credit.routes';
import analyticsRoutes from './analytics.routes';
import catalogRoutes from './catalog.routes';
import salesRoutes from './sales.routes';
import ritualRoutes from './ritual.routes';
import supplierRoutes from './supplier.routes';
import looseRoutes from './loose.routes';
import expiryRoutes from './expiry.routes';
import walletRoutes from './wallet.routes';
import assetRoutes from './asset.routes';
import parkedRoutes from './parked.routes';
import branchRoutes from './branch.routes';
import purchaseRoutes from './purchase.routes';
import supplierReturnRoutes from './supplierReturn.routes';
import accountingRoutes from './accounting.routes';

const router = Router();

router.get('/', (req, res) => {
    res.send('Kirana Tech API');
});

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/credit', creditRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/catalog', catalogRoutes);
router.use('/sales', salesRoutes);
router.use('/ritual', ritualRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/loose', looseRoutes);
router.use('/expiry', expiryRoutes);
router.use('/wallet', walletRoutes);
router.use('/assets', assetRoutes);
router.use('/parked', parkedRoutes);
import storeRoutes from './store.routes';

router.use('/branch', branchRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/returns', supplierReturnRoutes);
router.use('/accounting', accountingRoutes);
router.use('/store', storeRoutes);

export default router;
