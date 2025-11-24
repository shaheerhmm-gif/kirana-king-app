import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const getSuppliers = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.user!.storeId;
        const suppliers = await prisma.supplier.findMany({
            where: { storeId },
            include: {
                _count: {
                    select: { products: true, invoices: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching suppliers' });
    }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, gstin, address, state, pincode } = req.body;
        const storeId = req.user!.storeId;

        const existingSupplier = await prisma.supplier.findFirst({
            where: { storeId, name: { equals: name, mode: 'insensitive' } }
        });

        if (existingSupplier) {
            return res.status(400).json({ message: 'Supplier with this name already exists' });
        }

        const supplier = await prisma.supplier.create({
            data: {
                name,
                phone,
                gstin,
                address,
                state,
                pincode,
                storeId
            }
        });

        res.status(201).json({ message: 'Supplier created successfully', supplier });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating supplier' });
    }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, gstin, address, state, pincode } = req.body;
        const storeId = req.user!.storeId;

        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier || supplier.storeId !== storeId) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                phone,
                gstin,
                address,
                state,
                pincode
            }
        });

        res.json({ message: 'Supplier updated successfully', supplier: updatedSupplier });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating supplier' });
    }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.user!.storeId;

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: { _count: { select: { products: true, invoices: true } } }
        });

        if (!supplier || supplier.storeId !== storeId) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        if (supplier._count.products > 0 || supplier._count.invoices > 0) {
            return res.status(400).json({
                message: `Cannot delete supplier. Linked to ${supplier._count.products} products and ${supplier._count.invoices} invoices.`
            });
        }

        await prisma.supplier.delete({ where: { id } });

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting supplier' });
    }
};
