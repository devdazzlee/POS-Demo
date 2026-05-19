"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeIdParamSchema = exports.assignShiftSchema = void 0;
const zod_1 = require("zod");
exports.assignShiftSchema = zod_1.z.object({
    body: zod_1.z.object({
        employee_id: zod_1.z.string().uuid(),
        shift_time: zod_1.z.string(),
        start_date: zod_1.z.string().datetime(),
        end_date: zod_1.z.string().datetime().optional().nullable(),
    }),
});
exports.employeeIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        employee_id: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=shiftAssignment.validation.js.map