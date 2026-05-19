"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftAssignmentService = void 0;
const client_1 = require("../prisma/client");
class ShiftAssignmentService {
    // Assign a shift to an employee
    async assignShift({ employee_id, shift_time, start_date, end_date, break_time, }) {
        return await client_1.prisma.shiftAssignment.create({
            data: {
                employee_id,
                shift_time,
                start_date,
                end_date: end_date ?? null,
                break_time,
            },
        });
    }
    // Get current shift of an employee (where end_date is null)
    async getCurrentShift(employee_id) {
        return await client_1.prisma.shiftAssignment.findFirst({
            where: {
                employee_id,
                end_date: null,
            },
            orderBy: {
                start_date: 'desc',
            },
        });
    }
    // Get all shift history of an employee
    async getShiftHistory(employee_id) {
        return await client_1.prisma.shiftAssignment.findMany({
            where: { employee_id },
            orderBy: { start_date: 'desc' },
        });
    }
    // End current shift (set end_date and sales)
    async endCurrentShift(employee_id, end_date = new Date(), sales) {
        return await client_1.prisma.shiftAssignment.updateMany({
            where: {
                employee_id,
                end_date: null,
            },
            data: {
                end_date,
                sales: sales !== undefined ? sales : undefined,
            },
        });
    }
    // Get all shifts (optionally with filters/pagination)
    async getAllShifts() {
        return await client_1.prisma.shiftAssignment.findMany({
            orderBy: { start_date: 'desc' },
            include: { employee: true },
        });
    }
    // Update a shift by ID
    async updateShift(id, data) {
        return await client_1.prisma.shiftAssignment.update({
            where: { id },
            data,
        });
    }
    // Delete a shift by ID
    async deleteShift(id) {
        return await client_1.prisma.shiftAssignment.delete({
            where: { id },
        });
    }
}
exports.ShiftAssignmentService = ShiftAssignmentService;
//# sourceMappingURL=shiftAssignment.service.js.map