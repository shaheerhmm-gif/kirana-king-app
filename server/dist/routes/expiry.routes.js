"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const expiry_controller_1 = require("../controllers/expiry.controller");
const router = (0, express_1.Router)();
router.get('/items', auth_middleware_1.authenticate, expiry_controller_1.getExpiringItems);
router.put('/:id/discount', auth_middleware_1.authenticate, expiry_controller_1.moveToDiscount);
exports.default = router;
