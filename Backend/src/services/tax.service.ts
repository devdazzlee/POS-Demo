import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateTaxInput, UpdateTaxInput } from '../validations/tax.validation';

export class TaxService {
    async createTax(data: CreateTaxInput) {
        const [existingTax, lastTax] = await Promise.all([
            prisma.tax.findFirst({
                where: {
                    name: data.name,
                },
            }),
            prisma.tax.findFirst({
                orderBy: { created_at: 'desc' },
                select: { code: true },
            }),
        ]);

        if (existingTax) throw new AppError(400, 'Tax already exists');

        const newCode = lastTax ? (parseInt(lastTax.code) + 1).toString() : '1000';

        const tax = await prisma.tax.create({
            data: {
                ...data,
                code: newCode
            },
        });

        return tax;
    }

    async getTaxById(id: string) {
        const tax = await prisma.tax.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!tax) throw new AppError(404, 'Tax not found');
        return tax;
    }

    async updateTax(id: string, data: UpdateTaxInput) {
        await this.getTaxById(id); // Verify exists
        return prisma.tax.update({
            where: { id },
            data,
        });
    }

    async toggletaxestatus(id: string) {
        const tax = await this.getTaxById(id);
        return prisma.tax.update({
            where: { id },
            data: { is_active: !tax.is_active },
        });
    }

    async listTaxes({
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
        const where: Prisma.TaxWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (is_active !== undefined) {
            where.is_active = is_active;
        }

        if (display_on_pos !== undefined) {
            where.display_on_pos = display_on_pos;
        }

        const [taxes, total] = await Promise.all([
            prisma.tax.findMany({
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
            prisma.tax.count({ where }),
        ]);

        return {
            data: taxes.map(t => ({
                ...t,
                product_count: t._count.products,
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