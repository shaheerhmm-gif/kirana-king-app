import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

import prisma from '../prisma';

// Stub for OCR - In production this would call Google Cloud Vision API or similar
// We simulate extracting data from an image.
interface OCRItem {
    name: string;
    quantity: number;
    rate: number;
    batchNo: string;
    expiry: string;
}

interface OCRResult {
    supplierName: string;
    invoiceDate: Date;
    totalAmount: number;
    items: OCRItem[];
}

const performOCR = (imageUrl: string): OCRResult => {
    // In a real app, this would call an OCR API.
    // For now, we return a structure that indicates scanning was attempted but no data found,
    // prompting the user to enter it manually.
    return {
        supplierName: '', // Empty to force manual entry
        invoiceDate: new Date(),
        totalAmount: 0,
        items: [], // Empty items
    };
};

export const scanInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl } = req.body;
        const storeId = req.user!.storeId;

        const ocrResult = performOCR(imageUrl);
        const alerts: string[] = [];

        // 1. Find or create supplier
        let supplier = await prisma.supplier.findFirst({
            where: { storeId, name: ocrResult.supplierName },
        });

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: { name: ocrResult.supplierName, storeId },
            });
        }

        // 2. Process items and run Watchdog checks
        const processedItems = [];
        for (const item of ocrResult.items) {
            // Find product to check history
            let product = await prisma.product.findUnique({
                where: { storeId_name: { storeId, name: item.name } },
            });

            if (product) {
                // Check for Price Creep
                // Get last purchase price
                const lastBatch = await prisma.batch.findFirst({
                    where: { productId: product.id },
                    orderBy: { createdAt: 'desc' },
                });

                if (lastBatch) {
                    if (item.rate > lastBatch.purchasePrice) {
                        const diff = item.rate - lastBatch.purchasePrice;
                        alerts.push(`Price Creep Alert: ${item.name} rate increased by ₹${diff} (Old: ₹${lastBatch.purchasePrice}, New: ₹${item.rate})`);
                    }
                }
            } else {
                // Create product if new
                product = await prisma.product.create({
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
        const invoice = await prisma.invoice.create({
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
            const product = await prisma.product.findUnique({ where: { storeId_name: { storeId, name: item.name } } });
            if (product) {
                await prisma.batch.create({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
