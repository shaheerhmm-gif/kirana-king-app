import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { supplierId, items, status } = req.body;
        const storeId = req.user!.storeId;
        const userId = req.user!.userId;

        const po = await prisma.purchaseOrder.create({
            data: {
                storeId,
                supplierId,
                status: status || 'DRAFT',
                totalAmount: items.reduce((sum: number, item: any) => sum + (item.rate * item.quantity), 0),
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        rate: item.rate
                    }))
                }
            },
            include: {
                items: true,
                supplier: true
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                storeId,
                userId,
                actionType: 'CREATE_PO',
                entityType: 'PURCHASE_ORDER',
                entityId: po.id,
                afterData: po as any
            }
        });

        res.status(201).json(po);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const pos = await prisma.purchaseOrder.findMany({
            where: { storeId },
            include: {
                supplier: true,
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPurchaseSuggestions = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        // Simple logic: Find products with stock < 10
        // In a real app, this would use sales velocity
        const lowStockProducts = await prisma.product.findMany({
            where: {
                storeId,
                batches: {
                    some: {
                        quantity: { lt: 10 }
                    }
                }
            },
            include: {
                batches: true,
                supplier: true
            }
        });

        // Group by supplier for easier PO creation
        const suggestions = lowStockProducts.map((p: any) => ({
            productId: p.id,
            productName: p.name,
            currentStock: p.batches.reduce((sum: number, b: any) => sum + b.quantity, 0),
            supplierId: p.supplierId,
            supplierName: p.supplier?.name,
            suggestedQuantity: 20 // Default reorder qty
        }));

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
