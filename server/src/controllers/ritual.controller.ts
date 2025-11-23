import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getNightlyChecks = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Cash Check (Total Sales for Today)
        // Note: In a real app, we'd filter by payment mode 'CASH'. 
        // For MVP, assuming all sales are relevant or just total revenue.
        // If schema has paymentMode, use it. Based on sales.controller, it doesn't seem to distinguish yet, 
        // but let's just sum totalAmount for now as "Expected Cash/Revenue".
        const todaysSales = await prisma.sale.aggregate({
            where: {
                storeId,
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _sum: {
                totalAmount: true,
            },
        });

        const expectedCash = todaysSales._sum.totalAmount || 0;

        // 2. Udhaar Check (Total Pending Credit)
        // Get all customers for this store
        const customers = await prisma.customer.findMany({
            where: { storeId },
            include: {
                creditEntries: true,
            },
        });

        let totalPendingUdhaar = 0;
        for (const customer of customers) {
            const balance = customer.creditEntries.reduce((acc, entry) => {
                return entry.type === 'DEBIT' ? acc + entry.amount : acc - entry.amount;
            }, 0);
            if (balance > 0) {
                totalPendingUdhaar += balance;
            }
        }

        // 3. Stock Check (Low Stock on Essentials)
        // Logic: Find top 10 selling products in last 30 days, check if stock < 10 (arbitrary threshold for MVP)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topSellingItems = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            },
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 10,
        });

        const lowStockItems = [];
        for (const item of topSellingItems) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { batches: true },
            });

            if (product) {
                const currentStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                // Threshold: If stock is less than 20% of what was sold in last 30 days (avg daily * few days) 
                // or just a hard limit like 5 units. Let's use hard limit 5 for simplicity.
                if (currentStock < 5) {
                    lowStockItems.push({
                        name: product.name,
                        currentStock,
                    });
                }
            }
        }

        res.json({
            expectedCash,
            totalPendingUdhaar,
            lowStockItems,
        });

    } catch (error) {
        console.error('Nightly Check Error:', error);
        res.status(500).json({ message: 'Server error during nightly checks' });
    }
};

export const closeDay = async (req: AuthRequest, res: Response) => {
    try {
        const { cashEntered, status, notes } = req.body;
        const storeId = req.user!.storeId;

        // In a real app, we might save this to a 'DailyClosure' table.
        // For MVP, we'll just log it or return success as if saved.
        // If we want to persist, we'd need a new model. 
        // Let's assume we just return success for now to unblock frontend.

        console.log(`Store ${storeId} closed day. Status: ${status}, Cash: ${cashEntered}`);

        res.json({ message: 'Day closed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error closing day' });
    }
};
