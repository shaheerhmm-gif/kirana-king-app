import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const getLedgers = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const ledgers = await prisma.ledgerAccount.findMany({
            where: { storeId },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 5
                }
            }
        });
        res.json(ledgers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createLedger = async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, code } = req.body;
        const storeId = req.user!.storeId;

        const ledger = await prisma.ledgerAccount.create({
            data: {
                storeId,
                name,
                type,
                code
            }
        });
        res.status(201).json(ledger);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getDayBook = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { date } = req.query;

        const targetDate = date ? new Date(date as string) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const entries = await prisma.journalEntry.findMany({
            where: {
                storeId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                ledgerAccount: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const exportTally = async (req: AuthRequest, res: Response) => {
    try {
        // Placeholder for Tally XML export logic
        // In a real implementation, this would generate an XML file compatible with Tally
        res.status(501).json({ message: 'Tally export not yet implemented' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const closeFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { closingDate } = req.body; // Date to close (e.g., 31st March)

        const closeDate = new Date(closingDate);
        const nextDay = new Date(closeDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 1. Get all ledgers
        const ledgers = await prisma.ledgerAccount.findMany({
            where: { storeId }
        });

        // 2. For each ledger, calculate balance and post Opening Balance for next day
        // Note: In a real system, we'd zero out Income/Expense to Retained Earnings.
        // For simplicity, we'll just carry forward Asset/Liability/Equity.

        const openingEntries = [];

        for (const ledger of ledgers) {
            if (['ASSET', 'LIABILITY', 'EQUITY'].includes(ledger.type)) {
                if (ledger.balance !== 0) {
                    openingEntries.push({
                        storeId,
                        ledgerAccountId: ledger.id,
                        amount: Math.abs(ledger.balance),
                        type: ledger.balance > 0 ? 'DEBIT' : 'CREDIT', // Assuming +ve is Debit
                        description: `Opening Balance for FY ${nextDay.getFullYear()}-${nextDay.getFullYear() + 1}`,
                        date: nextDay,
                        referenceType: 'OPENING_BALANCE'
                    });
                }
            } else {
                // Income/Expense accounts should be closed to Retained Earnings (Equity)
                // Skipping for MVP simplicity or assuming they reset.
            }
        }

        if (openingEntries.length > 0) {
            await prisma.journalEntry.createMany({
                data: openingEntries as any // Type cast needed for createMany with enums sometimes
            });
        }

        res.json({ message: 'Financial Year Closed Successfully', entriesCreated: openingEntries.length });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error closing financial year' });
    }
};
