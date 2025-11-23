"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/scan', auth_middleware_1.authenticate, invoice_controller_1.scanInvoice);
exports.default = router;
