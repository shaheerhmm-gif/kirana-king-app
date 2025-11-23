"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ritual_controller_1 = require("../controllers/ritual.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/checks', auth_middleware_1.authenticate, ritual_controller_1.getNightlyChecks);
router.post('/close', auth_middleware_1.authenticate, ritual_controller_1.closeDay);
exports.default = router;
