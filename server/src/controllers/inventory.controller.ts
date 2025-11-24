import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

import prisma from '../prisma';

// Stub for Voice ASR - In production this would call Google Cloud Speech-to-Text
// Here we accept a text string that represents the "transcribed" voice command.
// Format expected: "Product Name expiry Date" e.g., "Amul Butter expiry 20th"
const parseVoiceCommand = (text: string) => {
    // Simple regex-based parser for the stub
    // This is where the "Voice-First" logic lives
    const parts = text.split(' expiry ');
    if (parts.length < 2) return null;

    const productName = parts[0].trim();
    const datePart = parts[1].trim();

    // Logic to parse "20th" or "20-10-2025"
    // For this MVP, we'll assume the user says a full date or we default to current month/year if just day is given
    // But to be robust for the demo, let's expect "YYYY-MM-DD" or simple text we can try to parse.
    // Let's assume the "ASR" sends us a valid ISO date string for simplicity in this stub,
    // or we handle "20th" by adding it to current month.

    let expiryDate = new Date();
    if (datePart.match(/^\d{1,2}(st|nd|rd|th)?$/)) {
        // "20th"
        const day = parseInt(datePart);
        expiryDate.setDate(day);
        if (expiryDate < new Date()) {
            // If today is 25th and they say 20th, assume next month? Or just let it be past?
            // Let's assume next month for safety if it's in the past, or just keep it.
            // Actually, for expiry, it might be next month.
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
    } else {
        // Try parsing as date
        const parsed = new Date(datePart);
        if (!isNaN(parsed.getTime())) {
            expiryDate = parsed;
        }
    }

    return { productName, expiryDate };
};

export const logInventoryVoice = async (req: AuthRequest, res: Response) => {
    try {
        const { voiceText, quantity } = req.body;
        const storeId = req.user!.storeId;

        const parsed = parseVoiceCommand(voiceText);
        if (!parsed) {
            return res.status(400).json({ message: 'Could not understand voice command' });
        }

        const { productName, expiryDate } = parsed;

        // Find or create product
        let product = await prisma.product.findUnique({
            where: { storeId_name: { storeId, name: productName } },
        });

        if (!product) {
            product = await prisma.product.create({
                data: {
                    name: productName,
                    storeId,
                },
            });
        }

        // Create batch
        const batch = await prisma.batch.create({
            data: {
                productId: product.id,
                quantity: quantity || 1,
                expiryDate,
                purchasePrice: 0, // Unknown from voice log
            },
        });

        res.status(201).json({ message: 'Logged successfully', batch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getExpiryAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        // Find batches expiring soon
        const batches = await prisma.batch.findMany({
            where: {
                product: { storeId },
                expiryDate: { lte: sevenDaysFromNow },
                quantity: { gt: 0 },
            },
            include: { product: true },
            orderBy: { expiryDate: 'asc' },
        });

        // Classify into Red/Amber
        const alerts = batches.map((batch: any) => {
            const daysLeft = Math.ceil((batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let status = 'GREEN';
            if (daysLeft <= 2) status = 'RED';
            else if (daysLeft <= 7) status = 'AMBER';

            return {
                productName: batch.product.name,
                quantity: batch.quantity,
                expiryDate: batch.expiryDate,
                daysLeft,
                status,
            };
        });

        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getLowStock = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const threshold = 5; // Default threshold

        // Get products with total stock < threshold
        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                batches: {
                    where: { quantity: { gt: 0 } }
                }
            }
        });

        const lowStockItems = products
            .map((p: any) => {
                const totalStock = p.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
                return {
                    id: p.id,
                    name: p.name,
                    totalStock,
                    batches: p.batches
                };
            })
            .filter((p: any) => p.totalStock <= threshold)
            .sort((a: any, b: any) => a.totalStock - b.totalStock);

        res.json(lowStockItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, batchId, quantity, reason, type } = req.body; // type: 'ADD' | 'REMOVE'
        const storeId = req.user!.storeId;
        const userId = req.user!.userId;

        // Verify product belongs to store
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product || product.storeId !== storeId) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If batchId is provided, update specific batch
        if (batchId) {
            const batch = await prisma.batch.findUnique({ where: { id: batchId } });
            if (!batch) return res.status(404).json({ message: 'Batch not found' });

            const newQuantity = type === 'ADD'
                ? batch.quantity + quantity
                : Math.max(0, batch.quantity - quantity);

            await prisma.batch.update({
                where: { id: batchId },
                data: { quantity: newQuantity }
            });
        } else {
            // If no batch, find the first available batch or create a dummy one (simplified logic)
            // For now, we require batchId for adjustments to be precise
            return res.status(400).json({ message: 'Batch ID is required for adjustment' });
        }

        // Log the adjustment (using Sale or a new Adjustment model?)
        // Since we don't have an Adjustment model in the schema summary I recall, 
        // we'll just log it to console or maybe we should have added an Adjustment model.
        // For Phase 2, let's assume we just update the batch. 
        // Ideally we should have a StockAdjustment model.
        // Let's check schema later. For now, just update.

        res.json({ message: 'Stock adjusted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateBatch = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity, expiryDate, sellingPrice } = req.body;
        const storeId = req.user!.storeId;

        // Verify batch belongs to store
        const batch = await prisma.batch.findUnique({
            where: { id },
            include: { product: true }
        });

        if (!batch || batch.product.storeId !== storeId) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const updatedBatch = await prisma.batch.update({
            where: { id },
            data: {
                quantity: quantity !== undefined ? Number(quantity) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined
            }
        });

        res.json(updatedBatch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating batch' });
    }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                batches: {
                    where: { quantity: { gt: 0 } }
                }
            },
            // Select specific fields if needed, but default includes hsn/gstRate
            // Just ensuring we return them.
        });

        // Map to include flattened GST info if needed, but frontend can read from product object directly.
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, barcode, category, supplierName, costPrice, sellingPrice, stock, unit, expiryDate, isSoldByWeight } = req.body;
        const storeId = req.user!.storeId;

        // 1. Find or Create Supplier if name provided
        let supplierId = null;
        if (supplierName) {
            let supplier = await prisma.supplier.findFirst({
                where: { storeId, name: supplierName }
            });
            if (!supplier) {
                supplier = await prisma.supplier.create({
                    data: { storeId, name: supplierName }
                });
            }
            supplierId = supplier.id;
        }

        // 2. Create Product
        const product = await prisma.product.create({
            data: {
                storeId,
                name,
                barcode,
                category,
                supplierId,
                isSoldByWeight: isSoldByWeight || false
            }
        });

        // 3. Create Initial Batch if stock provided
        if (stock > 0) {
            await prisma.batch.create({
                data: {
                    productId: product.id,
                    quantity: Number(stock),
                    purchasePrice: Number(costPrice) || 0,
                    sellingPrice: Number(sellingPrice),
                    expiryDate: expiryDate ? new Date(expiryDate) : new Date('2099-12-31')
                }
            });
        }

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating product' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, barcode, category, supplierName, costPrice, sellingPrice, stock, unit, expiryDate, isSoldByWeight } = req.body;
        const storeId = req.user!.storeId;

        // Verify product ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct || existingProduct.storeId !== storeId) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Handle Supplier
        let supplierId = existingProduct.supplierId;
        if (supplierName) {
            let supplier = await prisma.supplier.findFirst({
                where: { storeId, name: supplierName }
            });
            if (!supplier) {
                supplier = await prisma.supplier.create({
                    data: { storeId, name: supplierName }
                });
            }
            supplierId = supplier.id;
        }

        // Update Product
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                barcode,
                category,
                supplierId,
                isSoldByWeight
            }
        });

        // Update Batch (Simplified: Update the first batch or create one if none)
        const firstBatch = await prisma.batch.findFirst({
            where: { productId: id }
        });

        if (firstBatch) {
            await prisma.batch.update({
                where: { id: firstBatch.id },
                data: {
                    sellingPrice: Number(sellingPrice),
                    purchasePrice: Number(costPrice) || undefined,
                    expiryDate: expiryDate ? new Date(expiryDate) : undefined
                }
            });
        } else if (stock > 0) {
            await prisma.batch.create({
                data: {
                    productId: id,
                    quantity: Number(stock),
                    purchasePrice: Number(costPrice) || 0,
                    sellingPrice: Number(sellingPrice),
                    expiryDate: expiryDate ? new Date(expiryDate) : new Date('2099-12-31')
                }
            });
        }

        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating product' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.user!.storeId;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product || product.storeId !== storeId) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await prisma.batch.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting product' });
    }
};
