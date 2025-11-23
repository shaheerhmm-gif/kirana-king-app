import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Get all loose items
export const getLooseItems = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        const looseItems = await prisma.product.findMany({
            where: {
                storeId,
                isLoose: true
            },
            include: {
                looseConfig: true,
                batches: true
            }
        });

        const formattedItems = looseItems.map(item => {
            const levelPercentages: Record<string, number> = {
                FULL: 1.0,
                THREE_QUARTER: 0.75,
                HALF: 0.5,
                LOW: 0.2,
                EMPTY: 0
            };

            const fullQty = item.looseConfig?.fullQuantityKg || 0;
            const levelPct = item.looseLevel ? levelPercentages[item.looseLevel] : 0;
            const estimatedQty = fullQty * levelPct;

            return {
                id: item.id,
                name: item.name,
                looseLevel: item.looseLevel,
                estimatedQuantityKg: estimatedQty,
                fullQuantityKg: fullQty,
                looseConfig: item.looseConfig
            };
        });

        res.json(formattedItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update loose item level
export const updateLooseLevel = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { looseLevel } = req.body;

        const updated = await prisma.product.update({
            where: { id },
            data: { looseLevel }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get consumption stats and days left
export const getConsumptionStats = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.user!.storeId;

        const product = await prisma.product.findFirst({
            where: { id, storeId },
            include: {
                looseConfig: true,
                saleItems: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                        }
                    }
                }
            }
        });

        if (!product || !product.looseConfig) {
            return res.status(404).json({ message: 'Product not found or not configured' });
        }

        // Calculate consumption
        const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        const days = 30;
        const dailyAvg = totalSold / days;

        // Estimate current stock
        const levelPercentages: Record<string, number> = {
            FULL: 1.0,
            THREE_QUARTER: 0.75,
            HALF: 0.5,
            LOW: 0.2,
            EMPTY: 0
        };
        const levelPct = product.looseLevel ? levelPercentages[product.looseLevel] : 0;
        const estimatedStock = product.looseConfig.fullQuantityKg * levelPct;

        const daysLeft = dailyAvg > 0 ? estimatedStock / dailyAvg : null;

        res.json({
            dailyAvgConsumption: dailyAvg,
            estimatedStockKg: estimatedStock,
            daysLeft,
            totalSoldLast30Days: totalSold
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reorder suggestions
export const getReorderSuggestions = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        const looseItems = await prisma.product.findMany({
            where: {
                storeId,
                isLoose: true
            },
            include: {
                looseConfig: true,
                saleItems: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });

        const suggestions = looseItems
            .map(product => {
                if (!product.looseConfig) return null;

                const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
                const dailyAvg = totalSold / 30;

                const levelPercentages: Record<string, number> = {
                    FULL: 1.0,
                    THREE_QUARTER: 0.75,
                    HALF: 0.5,
                    LOW: 0.2,
                    EMPTY: 0
                };
                const levelPct = product.looseLevel ? levelPercentages[product.looseLevel] : 0;
                const estimatedStock = product.looseConfig.fullQuantityKg * levelPct;

                const daysLeft = dailyAvg > 0 ? estimatedStock / dailyAvg : 999;
                const threshold = product.looseConfig.leadTimeDays + product.looseConfig.safetyStockDays;

                if (daysLeft < threshold) {
                    return {
                        id: product.id,
                        name: product.name,
                        daysLeft,
                        estimatedStockKg: estimatedStock,
                        dailyAvgConsumption: dailyAvg,
                        shouldReorder: true,
                        urgency: daysLeft < product.looseConfig.leadTimeDays ? 'HIGH' : 'MEDIUM'
                    };
                }
                return null;
            })
            .filter(item => item !== null);

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Configure loose item
export const configureLooseItem = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, fullQuantityKg, reorderPointKg, leadTimeDays, safetyStockDays } = req.body;

        // First mark product as loose
        await prisma.product.update({
            where: { id: productId },
            data: { isLoose: true }
        });

        // Create or update config
        const config = await prisma.looseConfig.upsert({
            where: { productId },
            create: {
                productId,
                fullQuantityKg,
                reorderPointKg: reorderPointKg || 10,
                leadTimeDays: leadTimeDays || 3,
                safetyStockDays: safetyStockDays || 2
            },
            update: {
                fullQuantityKg,
                reorderPointKg,
                leadTimeDays,
                safetyStockDays
            }
        });

        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
