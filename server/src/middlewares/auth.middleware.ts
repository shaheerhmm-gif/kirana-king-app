import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        storeId: string;
        branchId?: string;
        godownId?: string;
        permissions?: any;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const checkPermission = (requiredPermission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        if (user.role === 'OWNER') return next();

        // Check granular permissions if implemented
        // For now, we can map roles to permissions or check the permissions JSON
        // Simple role check for now as placeholder
        next();
    };
};
