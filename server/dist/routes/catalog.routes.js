"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalog_controller_1 = require("../controllers/catalog.controller");
const router = (0, express_1.Router)();
router.get('/:storeId', catalog_controller_1.getCatalog);
router.post('/order', catalog_controller_1.generateOrderPayload);
router.post('/impulse', catalog_controller_1.getImpulseSuggestions);
exports.default = router;
