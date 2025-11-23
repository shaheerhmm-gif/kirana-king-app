import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

import prisma from '../prisma';

export const addCreditTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { customerPhone, customerName, amount, type, description } = req.body;
        const storeId = req.user!.storeId;

        // Find or create customer
        let customer = await prisma.customer.findUnique({
            where: { storeId_phone: { storeId, phone: customerPhone } },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: customerName || 'Unknown',
                    phone: customerPhone,
                    storeId,
                },
            });
        }

        // Check credit limit if debiting
        if (type === 'DEBIT') {
            const currentBalance = await calculateBalance(customer.id);
            if (currentBalance + amount > customer.creditLimit) {
                return res.status(400).json({
                    message: 'Credit limit exceeded',
                    currentBalance,
                    limit: customer.creditLimit,
                });
            }
        }

        const entry = await prisma.creditEntry.create({
            data: {
                customerId: customer.id,
                amount,
                type,
                description,
            },
        });

        res.status(201).json({ message: 'Transaction recorded', entry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const calculateBalance = async (customerId: string) => {
    const entries = await prisma.creditEntry.findMany({ where: { customerId } });
    return entries.reduce((acc: number, entry: any) => {
        return entry.type === 'DEBIT' ? acc + entry.amount : acc - entry.amount;
    }, 0);
};

export const getCustomerBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.params;
        const balance = await calculateBalance(customerId);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const generateWhatsAppReminder = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.body;
        const storeId = req.user!.storeId;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { store: true },
        });

        if (!customer || customer.storeId !== storeId) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const balance = await calculateBalance(customerId);

        if (balance <= 0) {
            return res.status(400).json({ message: 'No pending dues' });
        }

        // Generate "Soft Nudge" payload
        const storeName = customer.store.name;
        const upiLink = `upi://pay?pa=${(req.user as any).phone}@upi&pn=${encodeURIComponent(storeName)}&am=${balance}&cu=INR`; // Stub UPI link

        const message = `Namaste ${customer.name}, this is a gentle reminder from ${storeName}. Your pending balance is ₹${balance}. Please pay at your earliest convenience. Link: ${upiLink}`;

        // In a real app, we would use WhatsApp Business API here.
        // For now, we return the payload for the frontend to open `wa.me` link.
        const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;

        res.json({ message: 'Reminder generated', whatsappUrl, text: message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const customers = await prisma.customer.findMany({
            where: { storeId },
            orderBy: { name: 'asc' },
        });
        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTrustScore = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.params;
        const storeId = req.user!.storeId;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { creditEntries: true }
        });

        if (!customer || customer.storeId !== storeId) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Calculate Balance
        const balance = customer.creditEntries.reduce((acc, entry) => {
            return entry.type === 'DEBIT' ? acc + entry.amount : acc - entry.amount;
        }, 0);

        // Trust Score Logic
        let score = 100;
        const creditLimit = customer.creditLimit || 500;

        // 1. Credit Utilization Penalty
        if (balance > creditLimit) {
            score -= 30; // Over limit
        }
        if (balance > creditLimit * 1.5) {
            score -= 20; // Way over limit (Total -50)
        }

        // 2. Payment History Bonus/Penalty
        const payments = customer.creditEntries.filter(e => e.type === 'CREDIT');
        if (payments.length === 0) {
            // New customer, neutral start
            score = 70;
        } else if (payments.length > 5) {
            score += 10; // Frequent payer
        }

        // Cap score
        score = Math.min(100, Math.max(0, score));

        // Determine Status
        let status = 'GREEN';
        if (score < 50) status = 'RED';
        else if (score < 80) status = 'YELLOW';

        res.json({
            score,
            status,
            balance,
            creditLimit
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
