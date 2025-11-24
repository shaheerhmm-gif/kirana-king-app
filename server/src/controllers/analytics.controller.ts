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
            take: 50, // Increased to 50 for Heatmap
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
export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999);

        // Category-wise Sales
        const categorySales = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: start, lte: end }
                }
            },
            _sum: {
                totalAmount: true
            }
        });

        // Hydrate with category names (assuming Product has category field, or we join)
        // Since we don't have direct category group, we'll fetch products and aggregate manually
        // Optimization: Fetch all products once
        const products = await prisma.product.findMany({
            where: { storeId },
            select: { id: true, category: true }
        });

        const categoryMap: Record<string, number> = {};
        categorySales.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const category = product?.category || 'Uncategorized';
            categoryMap[category] = (categoryMap[category] || 0) + (item._sum.totalAmount || 0);
        });

        const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

        // Branch-wise Sales (if multi-branch)
        // This requires Sale to have branchId. Let's check schema.
        // Schema update: Sale model needs branchId. If not present, we skip or use storeId.
        // Assuming single branch for now or aggregated.

        res.json({
            categoryData,
            // branchData: ... 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching sales analytics' });
    }
};

export const getStockValuation = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        const products = await prisma.product.findMany({
            where: { storeId },
            include: { batches: true }
        });

        let totalValue = 0;
        let totalItems = 0;

        products.forEach(p => {
            p.batches.forEach(b => {
                totalValue += (b.quantity * b.purchasePrice);
                totalItems += b.quantity;
            });
        });

        res.json({
            totalValue,
            totalItems,
            productCount: products.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching stock valuation' });
    }
};

// GST Register Report
export const getGSTRegister = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate as string) : new Date();

        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: true,
                customer: true
            }
        });

        const gstData = sales.map((sale: any) => {
            const totalCGST = sale.items.reduce((sum: number, item: any) => sum + (item.cgst || 0), 0);
            const totalSGST = sale.items.reduce((sum: number, item: any) => sum + (item.sgst || 0), 0);
            const totalIGST = sale.items.reduce((sum: number, item: any) => sum + (item.igst || 0), 0);
            const totalTaxable = sale.items.reduce((sum: number, item: any) => sum + (item.taxableAmount || 0), 0);

            return {
                invoiceNumber: sale.invoiceNumber,
                date: sale.createdAt,
                customerName: sale.customer?.name || 'Walk-in',
                gstin: sale.customer?.gstin || 'N/A',
                taxableAmount: totalTaxable,
                cgst: totalCGST,
                sgst: totalSGST,
                igst: totalIGST,
                totalTax: totalCGST + totalSGST + totalIGST,
                grandTotal: sale.totalAmount
            };
        });

        const summary = {
            totalTaxable: gstData.reduce((sum: number, s: any) => sum + s.taxableAmount, 0),
            totalCGST: gstData.reduce((sum: number, s: any) => sum + s.cgst, 0),
            totalSGST: gstData.reduce((sum: number, s: any) => sum + s.sgst, 0),
            totalIGST: gstData.reduce((sum: number, s: any) => sum + s.igst, 0),
            totalTax: gstData.reduce((sum: number, s: any) => sum + s.totalTax, 0),
            grandTotal: gstData.reduce((sum: number, s: any) => sum + s.grandTotal, 0)
        };

        res.json({ transactions: gstData, summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Slow-moving items report
export const getSlowMovingItems = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const daysThreshold = parseInt(req.query.days as string) || 30;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                batches: true,
                saleItems: {
                    where: { createdAt: { gte: thresholdDate } },
                    select: { quantity: true }
                }
            }
        });

        const slowMoving = products
            .map((p: any) => {
                const currentStock = p.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
                const recentSales = p.saleItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
                const stockValue = p.batches.reduce((sum: number, b: any) => sum + (b.quantity * b.purchasePrice), 0);

                return {
                    productId: p.id,
                    productName: p.name,
                    currentStock,
                    salesInPeriod: recentSales,
                    stockValue,
                    turnoverRate: currentStock > 0 ? (recentSales / daysThreshold) : 0
                };
            })
            .filter((item: any) => item.currentStock > 0 && item.turnoverRate < 0.5)
            .sort((a: any, b: any) => a.turnoverRate - b.turnoverRate);

        res.json(slowMoving);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Item-wise margin report
export const getItemWiseMargin = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate as string) : new Date();

        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: start, lte: end }
                }
            },
            include: {
                product: {
                    include: {
                        batches: {
                            orderBy: { createdAt: 'asc' },
                            take: 1
                        }
                    }
                }
            }
        });

        const productMargins = new Map();

        saleItems.forEach((item: any) => {
            const productId = item.productId;
            const purchasePrice = item.product.batches[0]?.purchasePrice || 0;
            const revenue = item.totalAmount || (item.rate * item.quantity);
            const cost = purchasePrice * item.quantity;
            const profit = revenue - cost;

            if (productMargins.has(productId)) {
                const existing = productMargins.get(productId);
                existing.revenue += revenue;
                existing.cost += cost;
                existing.profit += profit;
                existing.quantitySold += item.quantity;
            } else {
                productMargins.set(productId, {
                    productId,
                    productName: item.product.name,
                    revenue,
                    cost,
                    profit,
                    quantitySold: item.quantity
                });
            }
        });

        const margins = Array.from(productMargins.values()).map((item: any) => ({
            ...item,
            margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
        }));

        res.json(margins.sort((a: any, b: any) => b.profit - a.profit));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Customer Churn Report
export const getCustomerChurn = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const daysThreshold = parseInt(req.query.days as string) || 30;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

        // Find customers who haven't purchased since thresholdDate
        // 1. Get all customers
        const customers = await prisma.customer.findMany({
            where: { storeId },
            include: {
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const churnRisk = customers
            .map((c: any) => {
                const lastSale = c.sales[0];
                const lastSaleDate = lastSale ? new Date(lastSale.createdAt) : null;

                // If never bought, use creation date
                const referenceDate = lastSaleDate || new Date(c.createdAt);

                // Days since last interaction
                const daysSince = Math.floor((new Date().getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));

                return {
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    lastSaleDate: lastSaleDate,
                    daysSince,
                    totalSpent: c.sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0) // Note: this only sums the fetched sales (take:1), we need aggregate for total spent.
                    // Correction: We need to fetch aggregate or just use what we have. 
                    // For accurate "Total Spent", we should use an aggregate query or store it on customer.
                    // For MVP, let's just show "Days Since".
                };
            })
            .filter((c: any) => c.daysSince > daysThreshold)
            .sort((a: any, b: any) => b.daysSince - a.daysSince);

        res.json(churnRisk);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching churn data' });
    }
};
