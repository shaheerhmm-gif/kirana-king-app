import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Get wallet balance for a customer
export const getWalletBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.params;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { walletBalance: true }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ balance: customer.walletBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add credit to wallet (e.g., from change)
export const addCredit = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, amount, description } = req.body;

        // Update wallet balance
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                walletBalance: {
                    increment: amount
                }
            }
        });

        // Create transaction record
        await prisma.walletTransaction.create({
            data: {
                customerId,
                amount,
                type: 'DEPOSIT',
                description: description || 'Change added to wallet'
            }
        });

        res.json({ balance: customer.walletBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Redeem credit from wallet
export const redeemCredit = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, amount, saleId, description } = req.body;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (customer.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Update wallet balance
        const updated = await prisma.customer.update({
            where: { id: customerId },
            data: {
                walletBalance: {
                    decrement: amount
                }
            }
        });

        // Create transaction record
        await prisma.walletTransaction.create({
            data: {
                customerId,
                amount: -amount,
                type: 'REDEMPTION',
                saleId,
                description: description || 'Wallet used in purchase'
            }
        });

        res.json({ balance: updated.walletBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get wallet transaction history
export const getWalletHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId } = req.params;

        const transactions = await prisma.walletTransaction.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get stale wallets (unused for >60 days)
export const getStaleWallets = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const customers = await prisma.customer.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
