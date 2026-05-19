"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expense_controller_1 = require("../controllers/expense.controller");
const expense_validation_1 = require("../validations/expense.validation");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN']));
router.post('/', (0, validation_middleware_1.validate)(expense_validation_1.createExpenseSchema), expense_controller_1.createExpense);
router.get('/', (0, validation_middleware_1.validate)(expense_validation_1.listExpensesSchema), expense_controller_1.listExpenses);
exports.default = router;
//# sourceMappingURL=expense.routes.js.map