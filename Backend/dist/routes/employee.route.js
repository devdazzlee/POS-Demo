"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employee_controller_1 = require("../controllers/employee.controller");
const employee_validation_1 = require("../validations/employee.validation");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const expense_controller_1 = require("../controllers/expense.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'SUPER_ADMIN']));
router.post('/', (0, validation_middleware_1.validate)(employee_validation_1.createEmployeeSchema), employee_controller_1.createEmployee);
router.get('/', (0, validation_middleware_1.validate)(employee_validation_1.listEmployeeSchema), employee_controller_1.listEmployees);
router.put('/:id', (0, validation_middleware_1.validate)(employee_validation_1.updateEmployeeSchema), employee_controller_1.updateEmployee);
router.delete('/:id', (0, validation_middleware_1.validate)(employee_validation_1.deleteEmployeeSchema), employee_controller_1.deleteEmployee);
router.post('/type', (0, validation_middleware_1.validate)(employee_validation_1.createEmployeeTypeSchema), expense_controller_1.createEmployeeType);
router.get('/types', expense_controller_1.getEmployeeTypes);
router.get('/type/:id', expense_controller_1.getEmployeeTypeById);
router.put('/type/:id', (0, validation_middleware_1.validate)(employee_validation_1.updateEmployeeTypeSchema), expense_controller_1.updateEmployeeType);
router.delete('/type/:id', expense_controller_1.deleteEmployeeType);
exports.default = router;
//# sourceMappingURL=employee.route.js.map