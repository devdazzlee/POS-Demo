"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
class SupplierService {
    async createSupplier(data) {
        const existingSupplier = await client_1.prisma.supplier.findFirst({
            where: { name: data.name },
        });
        if (existingSupplier)
            throw new apiError_1.AppError(400, 'Supplier already exists');
        // Existing rows use a `SUP-XXXXXX` format (random alphanumeric), not a
        // numeric sequence. The old `parseInt(lastSupplier.code)` approach
        // returned NaN against those codes — generate a fresh random suffix
        // and re-roll on the (extremely unlikely) collision.
        const generateCode = () => {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let suffix = '';
            for (let i = 0; i < 6; i++) {
                suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
            }
            return `SUP-${suffix}`;
        };
        let newCode = generateCode();
        for (let attempt = 0; attempt < 5; attempt++) {
            const clash = await client_1.prisma.supplier.findUnique({ where: { code: newCode } });
            if (!clash)
                break;
            newCode = generateCode();
        }
        const supplier = await client_1.prisma.supplier.create({
            data: {
                ...data,
                code: newCode,
                // Default to active so a newly-created supplier is immediately
                // usable. The frontend can still override via the form.
                status: data.status ?? 'active',
            },
        });
        return supplier;
    }
    async getSupplierById(id) {
        const supplier = await client_1.prisma.supplier.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!supplier)
            throw new apiError_1.AppError(404, 'Supplier not found');
        return supplier;
    }
    async updateSupplier(id, data) {
        await this.getSupplierById(id); // Verify exists
        return client_1.prisma.supplier.update({
            where: { id },
            data,
        });
    }
    async toggleSupplierStatus(id) {
        const supplier = await this.getSupplierById(id);
        const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
        return client_1.prisma.supplier.update({
            where: { id },
            data: { status: newStatus },
        });
    }
    async deleteSupplier(id) {
        const supplier = await client_1.prisma.supplier.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true,
                        purchase_orders: true,
                        purchases: true,
                    },
                },
            },
        });
        if (!supplier)
            throw new apiError_1.AppError(404, 'Supplier not found');
        // Prisma would throw a P2003 FK violation on delete — surface a clear,
        // actionable message instead so the UI can offer "disable" as the
        // recommended path.
        const { products, purchase_orders, purchases } = supplier._count;
        if (products > 0 || purchase_orders > 0 || purchases > 0) {
            const parts = [];
            if (products > 0)
                parts.push(`${products} product${products === 1 ? '' : 's'}`);
            if (purchases > 0)
                parts.push(`${purchases} purchase${purchases === 1 ? '' : 's'}`);
            if (purchase_orders > 0)
                parts.push(`${purchase_orders} purchase order${purchase_orders === 1 ? '' : 's'}`);
            throw new apiError_1.AppError(409, `Cannot delete supplier — it is linked to ${parts.join(', ')}. Disable the supplier instead.`);
        }
        await client_1.prisma.supplier.delete({ where: { id } });
        return { message: 'Supplier deleted successfully' };
    }
    async listSuppliers({ page = 1, limit = 10, search, is_active = true, display_on_pos = true, }) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { phone_number: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (display_on_pos !== undefined) {
            where.display_on_pos = display_on_pos;
        }
        const [suppliers, total] = await Promise.all([
            client_1.prisma.supplier.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    _count: {
                        select: { products: true },
                    },
                },
            }),
            client_1.prisma.supplier.count({ where }),
        ]);
        return {
            data: suppliers.map(s => ({
                ...s,
                product_count: s._count.products,
                _count: undefined,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.SupplierService = SupplierService;
//# sourceMappingURL=supplier.service.js.map