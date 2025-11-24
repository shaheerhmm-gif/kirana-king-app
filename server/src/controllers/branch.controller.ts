import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

// Get all branches for a store
export const getBranches = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const branches = await prisma.branch.findMany({
            where: { storeId, isActive: true },
            include: { godowns: true }
        });
        res.json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new branch
export const createBranch = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const { name, code, address } = req.body;

        const branch = await prisma.branch.create({
            data: {
                storeId,
                name,
                code,
                address
            }
        });

        // Auto-create a primary godown for the branch
        await prisma.godown.create({
            data: {
                branchId: branch.id,
                name: 'Main Godown',
                isPrimary: true
            }
        });

        res.status(201).json(branch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get godowns for a branch
export const getGodowns = async (req: AuthRequest, res: Response) => {
    try {
        const { branchId } = req.params;
        const godowns = await prisma.godown.findMany({
            where: { branchId, isActive: true }
        });
        res.json(godowns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a godown
export const createGodown = async (req: AuthRequest, res: Response) => {
    try {
        const { branchId } = req.params;
        const { name } = req.body;

        const godown = await prisma.godown.create({
            data: {
                branchId,
                name
            }
        });
        res.status(201).json(godown);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
