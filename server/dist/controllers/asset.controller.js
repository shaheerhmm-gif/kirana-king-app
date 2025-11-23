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
exports.getOverdueAssets = exports.getPendingAssets = exports.returnAsset = exports.giveAsset = exports.createAssetType = exports.getAssetTypes = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Get all asset types for a store
const getAssetTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const assetTypes = yield prisma_1.default.assetType.findMany({
            where: { storeId },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        res.json(assetTypes);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getAssetTypes = getAssetTypes;
// Create a new asset type
const createAssetType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, depositAmount, typicalReturnDays } = req.body;
        const storeId = req.user.storeId;
        const assetType = yield prisma_1.default.assetType.create({
            data: {
                name,
                depositAmount,
                typicalReturnDays: typicalReturnDays || 7,
                storeId
            }
        });
        res.json(assetType);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createAssetType = createAssetType;
// Record asset given to customer
const giveAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, assetTypeId, quantity, notes } = req.body;
        const assetType = yield prisma_1.default.assetType.findUnique({
            where: { id: assetTypeId }
        });
        if (!assetType) {
            return res.status(404).json({ message: 'Asset type not found' });
        }
        const depositAmount = assetType.depositAmount * quantity;
        const expectedReturnDate = new Date();
        expectedReturnDate.setDate(expectedReturnDate.getDate() + assetType.typicalReturnDays);
        const transaction = yield prisma_1.default.assetTransaction.create({
            data: {
                assetTypeId,
                customerId,
                quantity,
                type: 'GIVEN',
                depositAmount,
                expectedReturnDate,
                notes
            },
            include: {
                assetType: true,
                customer: true
            }
        });
        res.json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.giveAsset = giveAsset;
// Record asset returned by customer
const returnAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId, assetTypeId, quantity, notes } = req.body;
        const assetType = yield prisma_1.default.assetType.findUnique({
            where: { id: assetTypeId }
        });
        if (!assetType) {
            return res.status(404).json({ message: 'Asset type not found' });
        }
        const depositAmount = -(assetType.depositAmount * quantity); // Negative for refund
        const transaction = yield prisma_1.default.assetTransaction.create({
            data: {
                assetTypeId,
                customerId,
                quantity,
                type: 'RETURNED',
                depositAmount,
                notes
            },
            include: {
                assetType: true,
                customer: true
            }
        });
        res.json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.returnAsset = returnAsset;
// Get pending assets for a customer
const getPendingAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId } = req.params;
        const transactions = yield prisma_1.default.assetTransaction.groupBy({
            by: ['assetTypeId'],
            where: { customerId },
            _sum: {
                quantity: true
            }
        });
        const pendingAssets = yield Promise.all(transactions.map((txn) => __awaiter(void 0, void 0, void 0, function* () {
            const given = yield prisma_1.default.assetTransaction.aggregate({
                where: {
                    customerId,
                    assetTypeId: txn.assetTypeId,
                    type: 'GIVEN'
                },
                _sum: { quantity: true }
            });
            const returned = yield prisma_1.default.assetTransaction.aggregate({
                where: {
                    customerId,
                    assetTypeId: txn.assetTypeId,
                    type: 'RETURNED'
                },
                _sum: { quantity: true }
            });
            const pending = (given._sum.quantity || 0) - (returned._sum.quantity || 0);
            if (pending > 0) {
                const assetType = yield prisma_1.default.assetType.findUnique({
                    where: { id: txn.assetTypeId }
                });
                return {
                    assetType,
                    pendingQuantity: pending,
                    depositValue: pending * ((assetType === null || assetType === void 0 ? void 0 : assetType.depositAmount) || 0)
                };
            }
            return null;
        })));
        res.json(pendingAssets.filter(item => item !== null));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPendingAssets = getPendingAssets;
// Get overdue assets
const getOverdueAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeId = req.user.storeId;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const overdueTransactions = yield prisma_1.default.assetTransaction.findMany({
            where: {
                type: 'GIVEN',
                assetType: { storeId },
                expectedReturnDate: { lt: sevenDaysAgo }
            },
            include: {
                assetType: true,
                customer: true
            },
            orderBy: {
                expectedReturnDate: 'asc'
            }
        });
        res.json(overdueTransactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getOverdueAssets = getOverdueAssets;
