import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

import prisma from '../prisma';

export const getDeadStock = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Logic: Find products that have stock > 0 AND (last sale was > 60 days ago OR no sales ever and created > 60 days ago)

        // 1. Get all products with stock
        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                batches: true,
                saleItems: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const deadStock = products.filter((product: any) => {
            const totalStock = product.batches.reduce((acc: number, b: any) => acc + b.quantity, 0);
            if (totalStock === 0) return false;

            const lastSale = product.saleItems[0];
            if (lastSale) {
                return lastSale.createdAt < sixtyDaysAgo;
            } else {
                // No sales, check creation date
                return product.createdAt < sixtyDaysAgo;
            }
        });

        const formatted = deadStock.map((p: any) => ({
            id: p.id,
            name: p.name,
            stock: p.batches.reduce((acc: number, b: any) => acc + b.quantity, 0),
            lastSale: p.saleItems[0]?.createdAt || 'Never',
            valueLocked: p.batches.reduce((acc: number, b: any) => acc + (b.quantity * b.purchasePrice), 0),
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTopItems = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Optional: Filter by time of day (Morning/Evening)
        // For MVP, we'll just get overall top items.
        // To implement time-of-day, we'd need raw SQL or complex filtering which Prisma makes slightly harder for "Hour of Day".
        // Let's stick to "Top Selling Recently" for now.

        const topItems = await prisma.saleItem.groupBy({
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
            take: 20,
        });

        // Hydrate with product details
        const hydratedItems = await Promise.all(
            topItems.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { batches: true } // To get price/stock
                });

                if (!product) return null;

                // Get current selling price (from latest batch or default)
                // Logic: Find latest batch with quantity > 0, or just latest batch
                const latestBatch = product.batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                const price = latestBatch?.sellingPrice || 0;
                const stock = product.batches.reduce((sum, b) => sum + b.quantity, 0);

                return {
                    id: product.id,
                    name: product.name,
                    price,
                    stock,
                    soldQuantity: item._sum.quantity
                };
            })
        );

        res.json(hydratedItems.filter(i => i !== null));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching top items' });
    }
};

export const getDailySales = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999);

        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                customer: true,
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate summaries
        const summary = {
            totalSales: 0,
            cash: 0,
            upi: 0,
            card: 0,
            credit: 0,
            split: 0,
            count: sales.length
        };

        sales.forEach(sale => {
            summary.totalSales += sale.totalAmount;

            if (sale.paymentMode === 'SPLIT') {
                summary.split += sale.totalAmount;
                sale.payments.forEach(p => {
                    if (p.mode === 'CASH') summary.cash += p.amount;
                    else if (p.mode === 'UPI') summary.upi += p.amount;
                    else if (p.mode === 'CARD') summary.card += p.amount;
                    else if (p.mode === 'CREDIT') summary.credit += p.amount;
                });
            } else {
                if (sale.paymentMode === 'CASH') summary.cash += sale.totalAmount;
                else if (sale.paymentMode === 'UPI') summary.upi += sale.totalAmount;
                else if (sale.paymentMode === 'CARD') summary.card += sale.totalAmount;
                else if (sale.paymentMode === 'CREDIT') summary.credit += sale.totalAmount;
            }
        });

        res.json({ summary, sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching daily sales' });
    }
};

export const getProfitLoss = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999);

        // Get all sales in range with items and batch info (via product)
        // Note: Ideally we should store purchase price at time of sale in SaleItem to be accurate.
        // For now, we'll fetch current batch price or product cost. 
        // Better approach: We need to know WHICH batch was sold. 
        // Our SaleItem doesn't link to Batch directly in schema? Let's check.
        // Schema check: SaleItem has productId, but not batchId. 
        // However, we decrement batch quantity in createSale.
        // LIMITATION: We don't know exactly which batch's cost to use if multiple batches exist.
        // MVP SOLUTION: Use the Weighted Average Cost or just the latest batch's purchase price.

        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                batches: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        let totalRevenue = 0;
        let totalCOGS = 0; // Cost of Goods Sold

        sales.forEach(sale => {
            totalRevenue += sale.totalAmount;
            sale.items.forEach(item => {
                // Use latest batch purchase price as approximation
                const purchasePrice = item.product.batches[0]?.purchasePrice || 0;
                totalCOGS += (purchasePrice * item.quantity);
            });
        });

        const grossProfit = totalRevenue - totalCOGS;
        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        res.json({
            totalRevenue,
            totalCOGS,
            grossProfit,
            margin,
            period: { start, end }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching P&L' });
    }
};
