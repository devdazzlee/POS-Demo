"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSalary = exports.updateSalary = exports.listSalaries = exports.createSalary = void 0;
const salary_service_1 = require("../services/salary.service");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const salaryService = new salary_service_1.SalaryService();
exports.createSalary = (0, asyncHandler_1.default)(async (req, res) => {
    const salary = await salaryService.createSalary(req.body);
    new apiResponse_1.ApiResponse(salary, 'Salary record created successfully', 201).send(res);
});
exports.listSalaries = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await salaryService.listSalaries(req.user?.branch_id, Number(page), Number(limit));
    new apiResponse_1.ApiResponse(result.data, 'Salaries fetched successfully', 200).send(res);
});
exports.updateSalary = (0, asyncHandler_1.default)(async (req, res) => {
    const salary = await salaryService.updateSalary(req.params.id, req.body);
    new apiResponse_1.ApiResponse(salary, 'Salary record updated successfully').send(res);
});
exports.deleteSalary = (0, asyncHandler_1.default)(async (req, res) => {
    await salaryService.deleteSalary(req.params.id);
    new apiResponse_1.ApiResponse(null, 'Salary record deleted successfully').send(res);
});
//# sourceMappingURL=salary.controller.js.map