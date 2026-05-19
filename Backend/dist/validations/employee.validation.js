"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeTypeSchema = exports.createEmployeeTypeSchema = exports.listEmployeeSchema = exports.deleteEmployeeSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email().optional(),
        phone_number: zod_1.z.string().optional(),
        cnic: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        join_date: zod_1.z.string().datetime(),
        employee_type_id: zod_1.z.string().uuid(),
    }),
});
exports.updateEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        // When `name` is sent, it must still be a real name. Without a length
        // check the backend silently accepts "" and the row's name disappears.
        name: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
        // Optional fields accept `null` so clearing them on the UI actually
        // clears them in the database (the columns are `String?` in Prisma).
        // For email we still validate format when a string is provided.
        email: zod_1.z.string().email().nullable().optional(),
        phone_number: zod_1.z.string().nullable().optional(),
        cnic: zod_1.z.string().nullable().optional(),
        gender: zod_1.z.string().nullable().optional(),
        join_date: zod_1.z.string().datetime().optional(),
        employee_type_id: zod_1.z.string().uuid().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
exports.deleteEmployeeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
exports.listEmployeeSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().optional(),
        limit: zod_1.z.coerce.number().optional(),
    }),
});
exports.createEmployeeTypeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        // Optional on the wire — when present, the service honors it. When
        // absent, Prisma falls back to the model's @default(true).
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.updateEmployeeTypeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=employee.validation.js.map