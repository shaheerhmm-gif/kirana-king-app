import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Park/Hold a bill
export const parkBill = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, items, subtotal, notes } = req.body;
        const userId = req.user!.userId;
        const storeId = req.user!.storeId;

        const parkedBill = await prisma.parkedBill.create({
            data: {
                storeId,
                userId,
                customerId: customerId || null,
                items: items, // JSON array of cart items
                subtotal,
                notes
            },
            include: {
                customer: true,
                user: true
            }
        });

        res.json(parkedBill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to park bill' });
    }
};

// Get all parked bills for current store
export const getParkedBills = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;

        const parkedBills = await prisma.parkedBill.findMany({
            where: { storeId },
            include: {
                customer: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: {
                parkedAt: 'desc'
            }
        });

        res.json(parkedBills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch parked bills' });
    }
};

// Resume a parked bill (retrieve its data)
export const resumeParkedBill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.user!.storeId;

        const parkedBill = await prisma.parkedBill.findFirst({
            where: {
                id,
                storeId
            },
            include: {
                customer: true
            }
        });

        if (!parkedBill) {
            return res.status(404).json({ message: 'Parked bill not found' });
        }

        res.json(parkedBill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to resume parked bill' });
    }
};

// Delete a parked bill (after completing sale or canceling)
export const deleteParkedBill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.user!.storeId;

        await prisma.parkedBill.deleteMany({
            where: {
                id,
                storeId
            }
        });

        res.json({ message: 'Parked bill deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete parked bill' });
    }
};

// Update a parked bill
export const updateParkedBill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { customerId, items, subtotal, notes } = req.body;
        const storeId = req.user!.storeId;

        const parkedBill = await prisma.parkedBill.updateMany({
            where: {
                id,
                storeId
            },
            data: {
                customerId: customerId || null,
                items,
                subtotal,
                notes
            }
        });

        if (parkedBill.count === 0) {
            return res.status(404).json({ message: 'Parked bill not found' });
        }

        const updated = await prisma.parkedBill.findFirst({
            where: { id },
            include: {
                customer: true,
                user: true
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update parked bill' });
    }
};
