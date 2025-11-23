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
exports.getCreditProfile = exports.recordPayment = exports.createInvoice = exports.getInvoices = exports.createSupplier = exports.getSuppliers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const suppliers = yield prisma_1.default.supplier.findMany({
            where: { storeId },
            include: {
                _count: {
                    select: { invoices: true }
                }
            }
        });
        res.json(suppliers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getSuppliers = getSuppliers;
const createSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const { name, phone } = req.body;
        const supplier = yield prisma_1.default.supplier.create({
            data: { name, phone, storeId }
        });
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createSupplier = createSupplier;
const getInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const invoices = yield prisma_1.default.invoice.findMany({
            where: { storeId },
            include: { supplier: true },
            orderBy: { dueDate: 'asc' }
        });
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getInvoices = getInvoices;
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const { supplierId, amount, invoiceDate, dueDate, notes, items } = req.body; // items: { productId, quantity, rate, expiryDate }[]
        // 1. Create Invoice
        const invoice = yield prisma_1.default.invoice.create({
            data: {
                storeId,
                supplierId,
                totalAmount: parseFloat(amount),
                invoiceDate: new Date(invoiceDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                status: 'PENDING',
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        rate: item.rate
                    }))
                }
            },
            include: { items: true }
        });
        // 2. Create Batches (Inward Stock)
        // For each item, create a new batch
        for (const item of items) {
            yield prisma_1.default.batch.create({
                data: {
                    productId: item.productId,
                    quantity: item.quantity,
                    purchasePrice: item.rate,
                    sellingPrice: item.sellingPrice || null, // Optional: update selling price
                    expiryDate: new Date(item.expiryDate)
                }
            });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createInvoice = createInvoice;
const recordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceId, amount, mode, reference } = req.body;
        // 1. Create Payment Record
        const payment = yield prisma_1.default.supplierPayment.create({
            data: {
                invoiceId,
                amount: parseFloat(amount),
                mode,
                reference
            }
        });
        // 2. Update Invoice Status
        const invoice = yield prisma_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });
        if (invoice) {
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            const status = totalPaid >= invoice.totalAmount ? 'PAID' : 'PENDING';
            yield prisma_1.default.invoice.update({
                where: { id: invoiceId },
                data: { status }
            });
        }
        res.json(payment);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.recordPayment = recordPayment;
const getCreditProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        // 1. Calculate Average Monthly Sales (Last 3 Months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const sales = yield prisma_1.default.sale.aggregate({
            where: {
                storeId,
                createdAt: { gte: threeMonthsAgo }
            },
            _sum: { totalAmount: true }
        });
        const totalSales = sales._sum.totalAmount || 0;
        const avgMonthlySales = totalSales / 3;
        // 2. Calculate Repayment Factor
        // For MVP, we'll simulate this based on invoice status
        // In a real app, we'd track payment history logs
        const invoices = yield prisma_1.default.invoice.findMany({
            where: { storeId }
        });
        const totalInvoices = invoices.length;
        const overdueInvoices = invoices.filter(i => {
            return i.status === 'OVERDUE' || (i.dueDate && new Date(i.dueDate) < new Date() && i.status === 'PENDING');
        }).length;
        const onTimeInvoices = totalInvoices - overdueInvoices;
        let repaymentFactor = 1.0;
        if (totalInvoices > 0) {
            const onTimeRatio = onTimeInvoices / totalInvoices;
            repaymentFactor = Math.max(0.5, Math.min(1.5, onTimeRatio * 1.5));
        }
        // 3. Calculate Credit Limit
        const baseLimit = avgMonthlySales * 0.20;
        const maxCredit = Math.round(baseLimit * repaymentFactor);
        // 4. Calculate Risk Score
        let riskScore = 100;
        // Penalty for overdue
        riskScore -= (overdueInvoices * 10);
        // Volatility penalty (simulated for MVP as 0)
        riskScore = Math.max(0, Math.min(100, riskScore));
        res.json({
            avgMonthlySales,
            repaymentFactor,
            creditLimit: maxCredit,
            riskScore,
            totalInvoices,
            overdueInvoices
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getCreditProfile = getCreditProfile;
