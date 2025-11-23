import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Get all asset types for a store
export const getAssetTypes = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        const assetTypes = await prisma.assetType.findMany({
            where: { storeId },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });

        res.json(assetTypes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new asset type
export const createAssetType = async (req: AuthRequest, res: Response) => {
    try {
        const { name, depositAmount, typicalReturnDays } = req.body;
        const storeId = req.user!.storeId;

        const assetType = await prisma.assetType.create({
            data: {
                name,
                depositAmount,
                typicalReturnDays: typicalReturnDays || 7,
                storeId
            }
        });

        res.json(assetType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Record asset given to customer
export const giveAsset = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, assetTypeId, quantity, notes } = req.body;

        const assetType = await prisma.assetType.findUnique({
            where: { id: assetTypeId }
        });

        if (!assetType) {
            return res.status(404).json({ message: 'Asset type not found' });
        }

        const depositAmount = assetType.depositAmount * quantity;
        const expectedReturnDate = new Date();
        expectedReturnDate.setDate(expectedReturnDate.getDate() + assetType.typicalReturnDays);

        const transaction = await prisma.assetTransaction.create({
            data: {
                assetTypeId,
                customerId,
                quantity,
                type: 'GIVEN',
                depositAmount,
                expectedReturnDate,
                notes
            },
            include: {
                assetType: true,
                customer: true
            }
        });

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Record asset returned by customer
export const returnAsset = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, assetTypeId, quantity, notes } = req.body;

        const assetType = await prisma.assetType.findUnique({
            where: { id: assetTypeId }
        });

        if (!assetType) {
            return res.status(404).json({ message: 'Asset type not found' });
        }

        const depositAmount = -(assetType.depositAmount * quantity); // Negative for refund

        const transaction = await prisma.assetTransaction.create({
            data: {
                assetTypeId,
                customerId,
                quantity,
                type: 'RETURNED',
                depositAmount,
                notes
            },
            include: {
                assetType: true,
                customer: true
            }
        });

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get pending assets for a customer
export const getPendingAssets = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.params;

        const transactions = await prisma.assetTransaction.groupBy({
            by: ['assetTypeId'],
            where: { customerId },
            _sum: {
                quantity: true
            }
        });

        const pendingAssets = await Promise.all(
            transactions.map(async (txn) => {
                const given = await prisma.assetTransaction.aggregate({
                    where: {
                        customerId,
                        assetTypeId: txn.assetTypeId,
                        type: 'GIVEN'
                    },
                    _sum: { quantity: true }
                });

                const returned = await prisma.assetTransaction.aggregate({
                    where: {
                        customerId,
                        assetTypeId: txn.assetTypeId,
                        type: 'RETURNED'
                    },
                    _sum: { quantity: true }
                });

                const pending = (given._sum.quantity || 0) - (returned._sum.quantity || 0);

                if (pending > 0) {
                    const assetType = await prisma.assetType.findUnique({
                        where: { id: txn.assetTypeId }
                    });

                    return {
                        assetType,
                        pendingQuantity: pending,
                        depositValue: pending * (assetType?.depositAmount || 0)
                    };
                }
                return null;
            })
        );

        res.json(pendingAssets.filter(item => item !== null));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get overdue assets
export const getOverdueAssets = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const overdueTransactions = await prisma.assetTransaction.findMany({
            where: {
                type: 'GIVEN',
                assetType: { storeId },
                expectedReturnDate: { lt: sevenDaysAgo }
            },
            include: {
                assetType: true,
                customer: true
            },
            orderBy: {
                expectedReturnDate: 'asc'
            }
        });

        res.json(overdueTransactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
