"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesSchema = exports.getCategorySchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const categoryBaseSchema = {
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    slug: zod_1.z.string().min(1, 'Slug is required').max(100),
    display_on_branches: zod_1.z.array(zod_1.z.string()).optional(),
    get_tax_from_item: zod_1.z.boolean().optional().default(false),
    editable_sale_rate: zod_1.z.boolean().optional().default(false),
    display_on_pos: zod_1.z.boolean().optional().default(true),
    branch_id: zod_1.z.string().optional(),
};
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        ...categoryBaseSchema,
        // code is auto-generated so not in create schema
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        ...categoryBaseSchema,
        name: categoryBaseSchema.name.optional(),
        slug: categoryBaseSchema.slug.optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Category ID is required'),
    }),
});
exports.getCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Category ID is required'),
    }),
});
exports.listCategoriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        is_active: zod_1.z.string().optional(),
        branch_id: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=category.validation.js.map