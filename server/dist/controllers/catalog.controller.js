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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImpulseSuggestions = exports.generateOrderPayload = exports.getCatalog = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getCatalog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storeId } = req.params;
        const products = yield prisma.product.findMany({
            where: { storeId },
            include: {
                batches: {
                    where: { quantity: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' },
                    take: 1, // Get the batch expiring soonest to show price? Or just use latest price?
                },
            },
        });
        const catalog = products
            .filter((p) => p.batches.length > 0)
            .map((p) => {
            var _a, _b;
            return ({
                id: p.id,
                name: p.name,
                price: ((_a = p.batches[0]) === null || _a === void 0 ? void 0 : _a.sellingPrice) || ((_b = p.batches[0]) === null || _b === void 0 ? void 0 : _b.purchasePrice) * 1.1 || 0, // Fallback price logic
                available: p.batches.reduce((acc, b) => acc + b.quantity, 0),
            });
        });
        res.json(catalog);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getCatalog = getCatalog;
const generateOrderPayload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { storeId, items } = req.body; // items: { productId, quantity }[]
        const store = yield prisma.store.findUnique({ where: { id: storeId }, include: { users: { where: { role: 'OWNER' } } } });
        if (!store)
            return res.status(404).json({ message: 'Store not found' });
        const ownerPhone = (_a = store.users[0]) === null || _a === void 0 ? void 0 : _a.phone;
        if (!ownerPhone)
            return res.status(404).json({ message: 'Store owner not found' });
        let message = `Hi, I would like to order:\n`;
        let totalEstimated = 0;
        for (const item of items) {
            const product = yield prisma.product.findUnique({
                where: { id: item.productId },
                include: { batches: { take: 1 } },
            });
            if (product) {
                const price = ((_b = product.batches[0]) === null || _b === void 0 ? void 0 : _b.sellingPrice) || 0;
                message += `- ${product.name} x ${item.quantity} (Est. ₹${price * item.quantity})\n`;
                totalEstimated += price * item.quantity;
            }
        }
        message += `\nTotal Est: ₹${totalEstimated}`;
        const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
        res.json({ whatsappUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.generateOrderPayload = generateOrderPayload;
const getImpulseSuggestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storeId, cartItemIds } = req.body; // List of product IDs in cart
        // Simple association rule mining (stubbed)
        // In real app: Look at past Sales containing these items and find co-occurring items.
        // Here: Just return random "popular" items that are NOT in the cart.
        const suggestions = yield prisma.product.findMany({
            where: {
                storeId,
                id: { notIn: cartItemIds },
            },
            take: 3,
        });
        res.json(suggestions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getImpulseSuggestions = getImpulseSuggestions;
