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
exports.moveToDiscount = exports.getExpiringItems = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Get items grouped by expiry urgency
const getExpiringItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const today = new Date();
        const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const batches = yield prisma_1.default.batch.findMany({
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
        const expired = [];
        const expiring15Days = [];
        const expiring30Days = [];
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
            }
            else if (batch.expiryDate <= in15Days) {
                expiring15Days.push(item);
            }
            else if (batch.expiryDate <= in30Days) {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getExpiringItems = getExpiringItems;
// Move batch to discount (reduce price)
const moveToDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { discountPercent } = req.body;
        const batch = yield prisma_1.default.batch.findUnique({
            where: { id }
        });
        if (!batch || !batch.sellingPrice) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        const discountedPrice = batch.sellingPrice * (1 - discountPercent / 100);
        const updated = yield prisma_1.default.batch.update({
            where: { id },
            data: {
                sellingPrice: discountedPrice
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.moveToDiscount = moveToDiscount;
