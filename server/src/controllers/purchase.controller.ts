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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch products with batches and recent sales for "Smart Suggestions"
        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                batches: true,
                supplier: true,
                saleItems: {
                    where: {
                        createdAt: { gte: thirtyDaysAgo }
                    }
                }
            }
        });

        const suggestions = products
            .map((p: any) => {
                const currentStock = p.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);

                // Calculate average daily sales (AI/Smart Logic)
                const totalSold = p.saleItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
                const avgDailySales = totalSold / 30;

                // Determine reorder point
                // Logic: If selling, keep 7 days of stock (Lead time cover). 
                // If not selling, keep a minimum safety stock of 5.
                let reorderPoint = avgDailySales > 0 ? Math.ceil(avgDailySales * 7) : 5;

                // Suggest reorder if stock is below reorder point
                if (currentStock < reorderPoint) {
                    return {
                        productId: p.id,
                        productName: p.name,
                        currentStock,
                        supplierId: p.supplierId,
                        supplierName: p.supplier?.name,
                        // Suggest 21 days of stock (3 weeks) or default 20 units
                        suggestedQuantity: avgDailySales > 0 ? Math.ceil(avgDailySales * 21) : 20
                    };
                }
                return null;
            })
            .filter(Boolean); // Remove nulls

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
