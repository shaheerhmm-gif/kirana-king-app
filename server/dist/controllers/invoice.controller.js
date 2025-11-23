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
exports.scanInvoice = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Stub for OCR - In production this would call Google Cloud Vision API or similar
// We simulate extracting data from an image.
const performOCR = (imageUrl) => {
    // Mock data extraction based on "dummy" image URLs or random logic for demo
    // For the MVP, we will return a fixed structure but with some randomization to test alerts
    return {
        supplierName: 'Ganesh Traders',
        invoiceDate: new Date(),
        totalAmount: 1200,
        items: [
            { name: 'Sugar', quantity: 10, rate: 42, batchNo: 'B123', expiry: '2025-12-01' },
            { name: 'Tur Dal', quantity: 5, rate: 110, batchNo: 'T99', expiry: '2025-06-01' },
            { name: 'Lux Soap', quantity: 12, rate: 28, batchNo: 'L55', expiry: '2026-01-01' },
        ],
    };
};
const scanInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { imageUrl } = req.body;
        const storeId = req.user.storeId;
        const ocrResult = performOCR(imageUrl);
        const alerts = [];
        // 1. Find or create supplier
        let supplier = yield prisma.supplier.findFirst({
            where: { storeId, name: ocrResult.supplierName },
        });
        if (!supplier) {
            supplier = yield prisma.supplier.create({
                data: { name: ocrResult.supplierName, storeId },
            });
        }
        // 2. Process items and run Watchdog checks
        const processedItems = [];
        for (const item of ocrResult.items) {
            // Find product to check history
            let product = yield prisma.product.findUnique({
                where: { storeId_name: { storeId, name: item.name } },
            });
            if (product) {
                // Check for Price Creep
                // Get last purchase price
                const lastBatch = yield prisma.batch.findFirst({
                    where: { productId: product.id },
                    orderBy: { createdAt: 'desc' },
                });
                if (lastBatch) {
                    if (item.rate > lastBatch.purchasePrice) {
                        const diff = item.rate - lastBatch.purchasePrice;
                        alerts.push(`Price Creep Alert: ${item.name} rate increased by ₹${diff} (Old: ₹${lastBatch.purchasePrice}, New: ₹${item.rate})`);
                    }
                }
            }
            else {
                // Create product if new
                product = yield prisma.product.create({
                    data: { name: item.name, storeId },
                });
            }
            // Check for Scheme Omission (Stub logic)
            // Example: If buying 12 soaps, expect 1 free (if we had a scheme engine)
            if (item.name.includes('Soap') && item.quantity >= 12) {
                // Randomly trigger alert for demo
                // alerts.push(`Scheme Alert: You bought 12 ${item.name}. Check if you received 1 free unit.`);
            }
            processedItems.push({
                productId: product.id,
                quantity: item.quantity,
                rate: item.rate,
            });
        }
        // 3. Create Invoice Record
        const invoice = yield prisma.invoice.create({
            data: {
                storeId,
                supplierId: supplier.id,
                invoiceDate: ocrResult.invoiceDate,
                totalAmount: ocrResult.totalAmount,
                imageUrl,
                items: {
                    create: processedItems,
                },
            },
            include: { items: true },
        });
        // 4. Update Inventory (Batches)
        for (const item of ocrResult.items) {
            const product = yield prisma.product.findUnique({ where: { storeId_name: { storeId, name: item.name } } });
            if (product) {
                yield prisma.batch.create({
                    data: {
                        productId: product.id,
                        quantity: item.quantity,
                        expiryDate: new Date(item.expiry),
                        purchasePrice: item.rate,
                    },
                });
            }
        }
        res.json({
            message: 'Invoice processed successfully',
            invoiceId: invoice.id,
            alerts,
            data: ocrResult,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.scanInvoice = scanInvoice;
