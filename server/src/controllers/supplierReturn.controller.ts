import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const createSupplierReturn = async (req: AuthRequest, res: Response) => {
    try {
        const { supplierId, items, reason, totalAmount } = req.body;
        const storeId = req.user!.storeId;
        const userId = req.user!.userId;

        const supplierReturn = await prisma.supplierReturn.create({
            data: {
                storeId,
                supplierId,
                items, // JSON array of { productId, quantity, rate, reason }
                totalAmount,
                reason
            },
            include: {
                supplier: true
            }
        });

        // Update stock (reduce quantity)
        // Note: In a real app, we'd need to know which batch to deduct from.
        // For simplicity, we'll just deduct from the first available batch or handle it loosely.
        // Ideally, the UI should select specific batches (especially for expiry returns).

        // Log audit
        await prisma.auditLog.create({
            data: {
                storeId,
                userId,
                actionType: 'CREATE_RETURN',
                entityType: 'SUPPLIER_RETURN',
                entityId: supplierReturn.id,
                afterData: supplierReturn as any
            }
        });

        res.status(201).json(supplierReturn);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getSupplierReturns = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const returns = await prisma.supplierReturn.findMany({
            where: { storeId },
            include: {
                supplier: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(returns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
