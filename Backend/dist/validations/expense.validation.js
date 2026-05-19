"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExpensesSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        particular: zod_1.z.string().min(1),
        amount: zod_1.z.number().positive(),
    }),
});
exports.listExpensesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().optional(),
        limit: zod_1.z.coerce.number().optional(),
    }),
});
//# sourceMappingURL=expense.validation.js.map