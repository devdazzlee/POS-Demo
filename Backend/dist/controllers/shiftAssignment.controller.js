"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.getAllShifts = exports.endCurrentShift = exports.getShiftHistory = exports.getCurrentShift = exports.assignShift = void 0;
const shiftAssignment_service_1 = require("../services/shiftAssignment.service");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const shiftAssignmentService = new shiftAssignment_service_1.ShiftAssignmentService();
exports.assignShift = (0, asyncHandler_1.default)(async (req, res) => {
    const { employee_id, shift_time, start_date, end_date, break_time } = req.body;
    const assignment = await shiftAssignmentService.assignShift({
        employee_id,
        shift_time,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        break_time,
    });
    new apiResponse_1.ApiResponse(assignment, 'Shift assigned successfully', 201).send(res);
});
exports.getCurrentShift = (0, asyncHandler_1.default)(async (req, res) => {
    const { employee_id } = req.params;
    const currentShift = await shiftAssignmentService.getCurrentShift(employee_id);
    new apiResponse_1.ApiResponse(currentShift, 'Current shift fetched successfully', 200).send(res);
});
exports.getShiftHistory = (0, asyncHandler_1.default)(async (req, res) => {
    const { employee_id } = req.params;
    const history = await shiftAssignmentService.getShiftHistory(employee_id);
    new apiResponse_1.ApiResponse(history, 'Shift history fetched successfully', 200).send(res);
});
exports.endCurrentShift = (0, asyncHandler_1.default)(async (req, res) => {
    const { employee_id } = req.params;
    const { sales } = req.body;
    await shiftAssignmentService.endCurrentShift(employee_id, new Date(), sales !== undefined ? parseFloat(sales) : undefined);
    new apiResponse_1.ApiResponse(null, 'Current shift ended successfully', 200).send(res);
});
exports.getAllShifts = (0, asyncHandler_1.default)(async (req, res) => {
    const shifts = await shiftAssignmentService.getAllShifts();
    new apiResponse_1.ApiResponse(shifts, 'All shifts fetched successfully', 200).send(res);
});
exports.updateShift = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { shift_time, start_date, end_date, sales, break_time } = req.body;
    const updated = await shiftAssignmentService.updateShift(id, {
        shift_time,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date === null ? null : (end_date ? new Date(end_date) : undefined),
        sales: sales !== undefined ? parseFloat(sales) : undefined,
        break_time,
    });
    new apiResponse_1.ApiResponse(updated, 'Shift updated successfully', 200).send(res);
});
exports.deleteShift = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    await shiftAssignmentService.deleteShift(id);
    new apiResponse_1.ApiResponse(null, 'Shift deleted successfully', 200).send(res);
});
//# sourceMappingURL=shiftAssignment.controller.js.map