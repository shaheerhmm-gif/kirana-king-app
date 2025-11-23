"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const parked_controller_1 = require("../controllers/parked.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Park a new bill
router.post('/', parked_controller_1.parkBill);
// Get all parked bills
router.get('/', parked_controller_1.getParkedBills);
// Resume a specific parked bill
router.get('/:id', parked_controller_1.resumeParkedBill);
// Update a parked bill
router.put('/:id', parked_controller_1.updateParkedBill);
// Delete a parked bill
router.delete('/:id', parked_controller_1.deleteParkedBill);
exports.default = router;
