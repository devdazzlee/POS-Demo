"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salaryIdParamSchema = exports.listSalariesSchema = exports.createSalarySchema = void 0;
const zod_1 = require("zod");
exports.createSalarySchema = zod_1.z.object({
    body: zod_1.z.object({
        employee_id: zod_1.z.string().uuid(),
        month: zod_1.z.number().min(1).max(12),
        year: zod_1.z.number().min(2020),
        amount: zod_1.z.number(),
        is_paid: zod_1.z.boolean().optional(),
        paid_date: zod_1.z.string().datetime().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.listSalariesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().optional(),
        limit: zod_1.z.coerce.number().optional(),
    }),
});
exports.salaryIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=salary.validation.js.map