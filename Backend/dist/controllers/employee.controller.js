"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.listEmployees = exports.createEmployee = void 0;
const employee_service_1 = require("../services/employee.service");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const employeeService = new employee_service_1.EmployeeService();
exports.createEmployee = (0, asyncHandler_1.default)(async (req, res) => {
    const employee = await employeeService.createEmployee(req.body, req.user?.branch_id);
    new apiResponse_1.ApiResponse(employee, 'Employee created successfully', 201).send(res);
});
exports.listEmployees = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await employeeService.listEmployees(req.user?.branch_id, Number(page), Number(limit));
    new apiResponse_1.ApiResponse(result.data, 'Employees fetched successfully', 200).send(res);
});
exports.updateEmployee = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const updatedEmployee = await employeeService.updateEmployee(id, req.body);
    new apiResponse_1.ApiResponse(updatedEmployee, 'Employee updated successfully', 200).send(res);
});
exports.deleteEmployee = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    await employeeService.deleteEmployee(id);
    new apiResponse_1.ApiResponse(null, 'Employee deleted successfully', 200).send(res);
});
//# sourceMappingURL=employee.controller.js.map