"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployeeType = exports.updateEmployeeType = exports.getEmployeeTypeById = exports.getEmployeeTypes = exports.createEmployeeType = exports.listExpenses = exports.createExpense = void 0;
const expense_service_1 = require("../services/expense.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const expenseService = new expense_service_1.ExpenseService();
exports.createExpense = (0, asyncHandler_1.default)(async (req, res) => {
    const expense = await expenseService.createExpense(req.body);
    new apiResponse_1.ApiResponse(expense, 'Expense created successfully', 201).send(res);
});
exports.listExpenses = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await expenseService.listExpenses({
        page: Number(page),
        limit: Number(limit),
    });
    new apiResponse_1.ApiResponse(result.data, 'Expenses retrieved successfully', 200).send(res);
});
exports.createEmployeeType = (0, asyncHandler_1.default)(async (req, res) => {
    const data = await expenseService.create(req.body);
    new apiResponse_1.ApiResponse(data, 'Employee type created successfully', 201).send(res);
});
exports.getEmployeeTypes = (0, asyncHandler_1.default)(async (_req, res) => {
    const data = await expenseService.getAll();
    new apiResponse_1.ApiResponse(data, 'Employee types retrieved successfully').send(res);
});
exports.getEmployeeTypeById = (0, asyncHandler_1.default)(async (req, res) => {
    const data = await expenseService.getById(req.params.id);
    new apiResponse_1.ApiResponse(data, 'Employee type retrieved successfully').send(res);
});
exports.updateEmployeeType = (0, asyncHandler_1.default)(async (req, res) => {
    const data = await expenseService.update(req.params.id, req.body);
    new apiResponse_1.ApiResponse(data, 'Employee type updated successfully').send(res);
});
exports.deleteEmployeeType = (0, asyncHandler_1.default)(async (req, res) => {
    const data = await expenseService.delete(req.params.id);
    new apiResponse_1.ApiResponse(data, 'Employee type deleted successfully').send(res);
});
//# sourceMappingURL=expense.controller.js.map