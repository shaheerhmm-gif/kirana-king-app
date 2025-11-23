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
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phone, password, role, storeName } = req.body;
        // Check if user exists
        const existingUser = yield prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create store if not provided (for owner)
        let storeId = req.body.storeId;
        if (!storeId && role === 'OWNER') {
            const store = yield prisma.store.create({
                data: { name: storeName || `${name}'s Store` },
            });
            storeId = store.id;
        }
        if (!storeId) {
            return res.status(400).json({ message: 'Store ID required for helpers' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                role,
                storeId,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, storeId: user.storeId }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
        res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, storeId: user.storeId } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, password } = req.body;
        const user = yield prisma.user.findUnique({ where: { phone } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, storeId: user.storeId }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
        res.status(200).json({ token, user: { id: user.id, name: user.name, role: user.role, storeId: user.storeId } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
