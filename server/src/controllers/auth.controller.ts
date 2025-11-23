import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../prisma';

export const register = async (req: Request, res: Response) => {
    try {

        const { name, phone, password, role, storeName } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create store if not provided (for owner)
        let storeId = req.body.storeId;
        if (!storeId && role === 'OWNER') {
            const store = await prisma.store.create({
                data: { name: storeName || `${name}'s Store` },
            });
            storeId = store.id;
        }

        if (!storeId) {
            return res.status(400).json({ message: 'Store ID required for helpers' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                role,
                storeId,
            },
        });

        if (!process.env.JWT_SECRET) {
            throw new Error('FATAL: JWT_SECRET is not defined in environment variables');
        }

        const token = jwt.sign({ userId: user.id, role: user.role, storeId: user.storeId }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, storeId: user.storeId } });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({
            message: 'Server error during registration',
            details: error.message,
            type: error.code // Prisma error code if available
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, storeId: user.storeId }, process.env.JWT_SECRET!, {
            expiresIn: '30d',
        });

        res.status(200).json({ token, user: { id: user.id, name: user.name, role: user.role, storeId: user.storeId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
