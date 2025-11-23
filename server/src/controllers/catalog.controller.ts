import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import prisma from '../prisma';

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const { storeId } = req.params;

        const products = await prisma.product.findMany({
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
            .filter((p: any) => p.batches.length > 0)
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.batches[0]?.sellingPrice || p.batches[0]?.purchasePrice * 1.1 || 0, // Fallback price logic
                available: p.batches.reduce((acc: number, b: any) => acc + b.quantity, 0),
            }));

        res.json(catalog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const generateOrderPayload = async (req: Request, res: Response) => {
    try {
        const { storeId, items } = req.body; // items: { productId, quantity }[]

        const store = await prisma.store.findUnique({ where: { id: storeId }, include: { users: { where: { role: 'OWNER' } } } });
        if (!store) return res.status(404).json({ message: 'Store not found' });

        const ownerPhone = store.users[0]?.phone;
        if (!ownerPhone) return res.status(404).json({ message: 'Store owner not found' });

        let message = `Hi, I would like to order:\n`;
        let totalEstimated = 0;

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { batches: { take: 1 } },
            });
            if (product) {
                const price = product.batches[0]?.sellingPrice || 0;
                message += `- ${product.name} x ${item.quantity} (Est. ₹${price * item.quantity})\n`;
                totalEstimated += price * item.quantity;
            }
        }

        message += `\nTotal Est: ₹${totalEstimated}`;

        const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;

        res.json({ whatsappUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getImpulseSuggestions = async (req: Request, res: Response) => {
    try {
        const { storeId, cartItemIds } = req.body; // List of product IDs in cart

        // Simple association rule mining (stubbed)
        // In real app: Look at past Sales containing these items and find co-occurring items.
        // Here: Just return random "popular" items that are NOT in the cart.

        const suggestions = await prisma.product.findMany({
            where: {
                storeId,
                id: { notIn: cartItemIds },
            },
            take: 3,
        });

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
