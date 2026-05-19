import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateSupplierInput, UpdateSupplierInput } from '../validations/supplier.validation';

export class SupplierService {
    async createSupplier(data: CreateSupplierInput) {
        const existingSupplier = await prisma.supplier.findFirst({
            where: { name: data.name },
        });

        if (existingSupplier) throw new AppError(400, 'Supplier already exists');

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
            const clash = await prisma.supplier.findUnique({ where: { code: newCode } });
            if (!clash) break;
            newCode = generateCode();
        }

        const supplier = await prisma.supplier.create({
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

    async getSupplierById(id: string) {
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!supplier) throw new AppError(404, 'Supplier not found');
        return supplier;
    }

    async updateSupplier(id: string, data: UpdateSupplierInput) {
        await this.getSupplierById(id); // Verify exists
        return prisma.supplier.update({
            where: { id },
            data,
        });
    }

    async toggleSupplierStatus(id: string) {
        const supplier = await this.getSupplierById(id);
        const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
        return prisma.supplier.update({
            where: { id },
            data: { status: newStatus },
        });
    }

    async deleteSupplier(id: string) {
        const supplier = await prisma.supplier.findUnique({
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

        if (!supplier) throw new AppError(404, 'Supplier not found');

        // Prisma would throw a P2003 FK violation on delete — surface a clear,
        // actionable message instead so the UI can offer "disable" as the
        // recommended path.
        const { products, purchase_orders, purchases } = supplier._count;
        if (products > 0 || purchase_orders > 0 || purchases > 0) {
            const parts: string[] = [];
            if (products > 0) parts.push(`${products} product${products === 1 ? '' : 's'}`);
            if (purchases > 0) parts.push(`${purchases} purchase${purchases === 1 ? '' : 's'}`);
            if (purchase_orders > 0) parts.push(`${purchase_orders} purchase order${purchase_orders === 1 ? '' : 's'}`);
            throw new AppError(
                409,
                `Cannot delete supplier — it is linked to ${parts.join(', ')}. Disable the supplier instead.`,
            );
        }

        await prisma.supplier.delete({ where: { id } });
        return { message: 'Supplier deleted successfully' };
    }

    async listSuppliers({
        page = 1,
        limit = 10,
        search,
        is_active = true,
        display_on_pos = true,
    }: {
        page?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
        display_on_pos?: boolean;
    }) {
        const where: Prisma.SupplierWhereInput = {};

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
            prisma.supplier.findMany({
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
            prisma.supplier.count({ where }),
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