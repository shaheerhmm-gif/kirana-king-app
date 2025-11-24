import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const createSale = async (req: AuthRequest, res: Response) => {
    try {
        const { items, customerId, whatsappInvoice, paymentMode = 'CASH', payments } = req.body;
        const storeId = req.user!.storeId;
        const staffId = req.user!.userId;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in sale' });
        }

        // Calculate total
        const totalAmount = items.reduce((sum: number, item: any) => {
            return sum + (item.rate * item.quantity);
        }, 0);

        // Validate split payments if provided
        if (paymentMode === 'SPLIT' && payments) {
            const paymentsTotal = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            if (Math.abs(paymentsTotal - totalAmount) > 0.01) {
                return res.status(400).json({
                    message: 'Split payment amounts do not match total',
                    expected: totalAmount,
                    received: paymentsTotal
                });
            }
        }

        // Pre-process items to fetch Purchase Price from Batches
        const processedItems = await Promise.all(items.map(async (item: any) => {
            let purchasePrice = 0;
            if (item.batchId) {
                const batch = await prisma.batch.findUnique({
                    where: { id: item.batchId },
                    select: { purchasePrice: true }
                });
                if (batch) purchasePrice = batch.purchasePrice;
            } else {
                // If no batch ID (e.g. loose item), try to find average purchase price or latest batch
                const latestBatch = await prisma.batch.findFirst({
                    where: { productId: item.productId },
                    orderBy: { createdAt: 'desc' },
                    select: { purchasePrice: true }
                });
                if (latestBatch) purchasePrice = latestBatch.purchasePrice;
            }

            const gstRate = item.gstRate || 0;
            const rate = item.rate;
            const quantity = item.quantity;
            const taxableAmount = (rate * quantity) / (1 + gstRate / 100);
            const taxAmount = (rate * quantity) - taxableAmount;
            const cgst = taxAmount / 2;
            const sgst = taxAmount / 2;
            const igst = 0;

            return {
                productId: item.productId,
                quantity: item.quantity,
                rate: item.rate,
                purchasePrice,
                cgst,
                sgst,
                igst,
                taxableAmount,
                batchId: item.batchId // Keep for stock update
            };
        }));

        // Create sale with payment info
        const sale = await prisma.sale.create({
            data: {
                storeId,
                customerId: customerId || null,
                staffId,
                totalAmount,
                paymentMode,
                items: {
                    create: processedItems.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        rate: item.rate,
                        purchasePrice: item.purchasePrice,
                        cgst: item.cgst,
                        sgst: item.sgst,
                        igst: item.igst,
                        taxableAmount: item.taxableAmount
                    }))
                },
                // Create split payment records if applicable
                ...(paymentMode === 'SPLIT' && payments && {
                    payments: {
                        create: payments.map((p: any) => ({
                            mode: p.mode,
                            amount: p.amount,
                            reference: p.reference || null
                        }))
                    }
                })
            },
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
                await prisma.batch.update({
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
            await prisma.creditEntry.create({
                data: {
                    customerId,
                    amount: totalAmount,
                    type: 'DEBIT', // Customer owes us
                    description: `Sale #${sale.id.substring(0, 8)}`
                }
            });
        }

        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create sale' });
    }
};

export const getDailySales = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sales = await prisma.sale.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProductLedger = async (req: AuthRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const storeId = req.user!.storeId;

        // Verify product belongs to store
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || product.storeId !== storeId) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get Sales (Out)
        const sales = await prisma.saleItem.findMany({
            where: { productId },
            include: { sale: true },
            orderBy: { createdAt: 'desc' },
        });

        // Get Batches (In)
        const batches = await prisma.batch.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
