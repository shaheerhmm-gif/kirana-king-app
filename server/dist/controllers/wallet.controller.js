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
exports.getStaleWallets = exports.getWalletHistory = exports.redeemCredit = exports.addCredit = exports.getWalletBalance = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Get wallet balance for a customer
const getWalletBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId } = req.params;
        const customer = yield prisma_1.default.customer.findUnique({
            where: { id: customerId },
            select: { walletBalance: true }
        });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ balance: customer.walletBalance });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getWalletBalance = getWalletBalance;
// Add credit to wallet (e.g., from change)
const addCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, amount, description } = req.body;
        // Update wallet balance
        const customer = yield prisma_1.default.customer.update({
            where: { id: customerId },
            data: {
                walletBalance: {
                    increment: amount
                }
            }
        });
        // Create transaction record
        yield prisma_1.default.walletTransaction.create({
            data: {
                customerId,
                amount,
                type: 'DEPOSIT',
                description: description || 'Change added to wallet'
            }
        });
        res.json({ balance: customer.walletBalance });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.addCredit = addCredit;
// Redeem credit from wallet
const redeemCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, amount, saleId, description } = req.body;
        const customer = yield prisma_1.default.customer.findUnique({
            where: { id: customerId }
        });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        if (customer.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        // Update wallet balance
        const updated = yield prisma_1.default.customer.update({
            where: { id: customerId },
            data: {
                walletBalance: {
                    decrement: amount
                }
            }
        });
        // Create transaction record
        yield prisma_1.default.walletTransaction.create({
            data: {
                customerId,
                amount: -amount,
                type: 'REDEMPTION',
                saleId,
                description: description || 'Wallet used in purchase'
            }
        });
        res.json({ balance: updated.walletBalance });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.redeemCredit = redeemCredit;
// Get wallet transaction history
const getWalletHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId } = req.params;
        const transactions = yield prisma_1.default.walletTransaction.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(transactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getWalletHistory = getWalletHistory;
// Get stale wallets (unused for >60 days)
const getStaleWallets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const customers = yield prisma_1.default.customer.findMany({
            where: {
                storeId,
                walletBalance: { gt: 0 }
            },
            include: {
                walletTransactions: {
                    where: {
                        type: 'REDEMPTION',
                        createdAt: { gte: sixtyDaysAgo }
                    },
                    take: 1
                }
            }
        });
        // Filter customers with no recent redemptions
        const staleWallets = customers
            .filter(c => c.walletTransactions.length === 0)
            .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            balance: c.walletBalance
        }));
        res.json(staleWallets);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getStaleWallets = getStaleWallets;
