"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParkedBill = exports.deleteParkedBill = exports.resumeParkedBill = exports.getParkedBills = exports.parkBill = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Park/Hold a bill
const parkBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, items, subtotal, notes } = req.body;
        const userId = req.user.userId;
        const storeId = req.user.storeId;
        const parkedBill = yield prisma_1.default.parkedBill.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to park bill' });
    }
});
exports.parkBill = parkBill;
// Get all parked bills for current store
const getParkedBills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const parkedBills = yield prisma_1.default.parkedBill.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch parked bills' });
    }
});
exports.getParkedBills = getParkedBills;
// Resume a parked bill (retrieve its data)
const resumeParkedBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const storeId = req.user.storeId;
        const parkedBill = yield prisma_1.default.parkedBill.findFirst({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to resume parked bill' });
    }
});
exports.resumeParkedBill = resumeParkedBill;
// Delete a parked bill (after completing sale or canceling)
const deleteParkedBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const storeId = req.user.storeId;
        yield prisma_1.default.parkedBill.deleteMany({
            where: {
                id,
                storeId
            }
        });
        res.json({ message: 'Parked bill deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete parked bill' });
    }
});
exports.deleteParkedBill = deleteParkedBill;
// Update a parked bill
const updateParkedBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { customerId, items, subtotal, notes } = req.body;
        const storeId = req.user.storeId;
        const parkedBill = yield prisma_1.default.parkedBill.updateMany({
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
        const updated = yield prisma_1.default.parkedBill.findFirst({
            where: { id },
            include: {
                customer: true,
                user: true
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update parked bill' });
    }
});
exports.updateParkedBill = updateParkedBill;
