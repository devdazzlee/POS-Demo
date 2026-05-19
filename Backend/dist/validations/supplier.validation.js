"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSuppliersSchema = exports.getSupplierSchema = exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
// Optional contact fields are .nullable() so the Edit form can send `null`
// explicitly to clear a previously-set value. On create the frontend omits
// empty optionals entirely, so this still leaves NULL in the column.
const optionalString = zod_1.z.string().nullable().optional();
const optionalEmail = zod_1.z
    .string()
    .email('Invalid email format')
    .nullable()
    .optional();
const supplierBaseSchema = {
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    phone_number: optionalString,
    fax_number: optionalString,
    mobile_number: optionalString,
    country: optionalString,
    city: optionalString,
    status: optionalString,
    email: optionalEmail,
    ntn: optionalString,
    strn: optionalString,
    gov_id: optionalString,
    address: optionalString,
    display_on_pos: zod_1.z.boolean().optional().default(true),
};
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object(supplierBaseSchema),
});
exports.updateSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        ...supplierBaseSchema,
        name: zod_1.z.string().min(1, 'Name is required').max(100).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Supplier ID is required'),
    }),
});
exports.getSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Supplier ID is required'),
    }),
});
exports.listSuppliersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
        search: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=supplier.validation.js.map