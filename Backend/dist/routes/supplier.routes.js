"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supplier_controller_1 = require("../controllers/supplier.controller");
const supplier_validation_1 = require("../validations/supplier.validation");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_MANAGER', 'PURCHASE_MANAGER']));
router.post('/', (0, validation_middleware_1.validate)(supplier_validation_1.createSupplierSchema), supplier_controller_1.createSupplier);
router.get('/', (0, validation_middleware_1.validate)(supplier_validation_1.listSuppliersSchema), supplier_controller_1.listSuppliers);
router.get('/:id', (0, validation_middleware_1.validate)(supplier_validation_1.getSupplierSchema), supplier_controller_1.getSupplier);
router.put('/:id', (0, validation_middleware_1.validate)(supplier_validation_1.updateSupplierSchema), supplier_controller_1.updateSupplier);
router.patch('/:id/toggle-status', (0, validation_middleware_1.validate)(supplier_validation_1.getSupplierSchema), supplier_controller_1.toggleSupplierStatus);
router.delete('/:id', (0, validation_middleware_1.validate)(supplier_validation_1.getSupplierSchema), supplier_controller_1.deleteSupplier);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map