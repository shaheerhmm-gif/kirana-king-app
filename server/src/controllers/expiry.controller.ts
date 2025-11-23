import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Get items grouped by expiry urgency
export const getExpiringItems = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const today = new Date();
        const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        const batches = await prisma.batch.findMany({
            where: {
                product: { storeId },
                quantity: { gt: 0 } // Only items with stock
            },
            include: {
                product: true
            },
            orderBy: {
                expiryDate: 'asc'
            }
        });

        const expired: any[] = [];
        const expiring15Days: any[] = [];
        const expiring30Days: any[] = [];

        batches.forEach(batch => {
            const item = {
                id: batch.id,
                productId: batch.product.id,
                productName: batch.product.name,
                quantity: batch.quantity,
                expiryDate: batch.expiryDate,
                sellingPrice: batch.sellingPrice,
                purchasePrice: batch.purchasePrice
            };

            if (batch.expiryDate < today) {
                expired.push(item);
            } else if (batch.expiryDate <= in15Days) {
                expiring15Days.push(item);
            } else if (batch.expiryDate <= in30Days) {
                expiring30Days.push(item);
            }
        });

        res.json({
            expired,
            expiring15Days,
            expiring30Days,
            totalValue: {
                expired: expired.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0),
                expiring15Days: expiring15Days.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0),
                expiring30Days: expiring30Days.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Move batch to discount (reduce price)
export const moveToDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { discountPercent } = req.body;

        const batch = await prisma.batch.findUnique({
            where: { id }
        });

        if (!batch || !batch.sellingPrice) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const discountedPrice = batch.sellingPrice * (1 - discountPercent / 100);

        const updated = await prisma.batch.update({
            where: { id },
            data: {
                sellingPrice: discountedPrice
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
