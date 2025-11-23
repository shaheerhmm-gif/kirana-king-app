"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLooseItem = exports.getReorderSuggestions = exports.getConsumptionStats = exports.updateLooseLevel = exports.getLooseItems = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Get all loose items
const getLooseItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const looseItems = yield prisma_1.default.product.findMany({
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
            var _a;
            const levelPercentages = {
                FULL: 1.0,
                THREE_QUARTER: 0.75,
                HALF: 0.5,
                LOW: 0.2,
                EMPTY: 0
            };
            const fullQty = ((_a = item.looseConfig) === null || _a === void 0 ? void 0 : _a.fullQuantityKg) || 0;
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getLooseItems = getLooseItems;
// Update loose item level
const updateLooseLevel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { looseLevel } = req.body;
        const updated = yield prisma_1.default.product.update({
            where: { id },
            data: { looseLevel }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateLooseLevel = updateLooseLevel;
// Get consumption stats and days left
const getConsumptionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const storeId = req.user.storeId;
        const product = yield prisma_1.default.product.findFirst({
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
        const levelPercentages = {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getConsumptionStats = getConsumptionStats;
// Get reorder suggestions
const getReorderSuggestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const looseItems = yield prisma_1.default.product.findMany({
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
            if (!product.looseConfig)
                return null;
            const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
            const dailyAvg = totalSold / 30;
            const levelPercentages = {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getReorderSuggestions = getReorderSuggestions;
// Configure loose item
const configureLooseItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, fullQuantityKg, reorderPointKg, leadTimeDays, safetyStockDays } = req.body;
        // First mark product as loose
        yield prisma_1.default.product.update({
            where: { id: productId },
            data: { isLoose: true }
        });
        // Create or update config
        const config = yield prisma_1.default.looseConfig.upsert({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.configureLooseItem = configureLooseItem;
