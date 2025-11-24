import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const getStoreProfile = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });
        res.json(store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching store profile' });
    }
};

export const updateStoreProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, location, upiId } = req.body;
        const storeId = req.user!.storeId;

        // Update store profile including UPI ID
        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                name,
                location,
                upiId
            } as any
        });

        res.json({ message: 'Store profile updated successfully', store });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating store profile' });
    }
};
