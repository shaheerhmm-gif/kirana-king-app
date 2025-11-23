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
exports.getProductLedger = exports.getDailySales = exports.createSale = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, customerId, whatsappInvoice, paymentMode = 'CASH', payments } = req.body;
        const storeId = req.user.storeId;
        const staffId = req.user.userId;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in sale' });
        }
        // Calculate total
        const totalAmount = items.reduce((sum, item) => {
            return sum + (item.rate * item.quantity);
        }, 0);
        // Validate split payments if provided
        if (paymentMode === 'SPLIT' && payments) {
            const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(paymentsTotal - totalAmount) > 0.01) {
                return res.status(400).json({
                    message: 'Split payment amounts do not match total',
                    expected: totalAmount,
                    received: paymentsTotal
                });
            }
        }
        // Create sale with payment info
        const sale = yield prisma_1.default.sale.create({
            data: Object.assign({ storeId, customerId: customerId || null, staffId,
                totalAmount,
                paymentMode, items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        rate: item.rate
                    }))
                } }, (paymentMode === 'SPLIT' && payments && {
                payments: {
                    create: payments.map((p) => ({
                        mode: p.mode,
                        amount: p.amount,
                        reference: p.reference || null
                    }))
                }
            })),
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true,
                payments: true
            }
        });
        // Update batch quantities
        for (const item of items) {
            if (item.batchId) {
                yield prisma_1.default.batch.update({
                    where: { id: item.batchId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }
        }
        // Update customer credit if applicable
        if (customerId && paymentMode === 'CREDIT') {
            yield prisma_1.default.creditEntry.create({
                data: {
                    customerId,
                    amount: totalAmount,
                    type: 'DEBIT', // Customer owes us
                    description: `Sale #${sale.id.substring(0, 8)}`
                }
            });
        }
        res.json(sale);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create sale' });
    }
});
exports.createSale = createSale;
const getDailySales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const sales = yield prisma_1.default.sale.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                items: {
                    include: { product: true },
                },
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const summary = {
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
            totalItemsSold: sales.reduce((sum, sale) => sum + sale.items.reduce((is, i) => is + i.quantity, 0), 0),
            sales: sales,
        };
        res.json(summary);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getDailySales = getDailySales;
const getProductLedger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const storeId = req.user.storeId;
        // Verify product belongs to store
        const product = yield prisma_1.default.product.findUnique({
            where: { id: productId },
        });
        if (!product || product.storeId !== storeId) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Get Sales (Out)
        const sales = yield prisma_1.default.saleItem.findMany({
            where: { productId },
            include: { sale: true },
            orderBy: { createdAt: 'desc' },
        });
        // Get Batches (In)
        const batches = yield prisma_1.default.batch.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
        // Combine and sort
        const ledger = [
            ...sales.map(s => ({
                type: 'SALE',
                date: s.createdAt,
                quantity: s.quantity,
                price: s.rate,
                details: s.sale.customerId ? `Sold to Customer` : 'Cash Sale',
                refId: s.saleId
            })),
            ...batches.map(b => ({
                type: 'PURCHASE',
                date: b.createdAt,
                quantity: b.quantity,
                price: b.purchasePrice,
                details: `Batch Exp: ${new Date(b.expiryDate).toLocaleDateString()}`,
                refId: b.id
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(ledger);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProductLedger = getProductLedger;
