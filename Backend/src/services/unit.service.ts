import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateUnitInput, UpdateUnitInput } from '../validations/unit.validation';

export class UnitService {
    async createUnit(data: CreateUnitInput) {
        const [existingUnit, allUnits] = await Promise.all([
            prisma.unit.findFirst({
                where: {
                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },
                },
            }),
            prisma.unit.findMany({
                select: { code: true },
            }),
        ]);

        if (existingUnit) {
            throw new AppError(400, 'Unit with this name already exists');
        }

        const maxCode = allUnits.reduce((max, u) => {
            const parsed = parseInt(u.code, 10);
            return Number.isFinite(parsed) && parsed > max ? parsed : max;
        }, 999);
        const newCode = (maxCode + 1).toString();

        const unit = await prisma.unit.create({
            data: {
                ...data,
                code: newCode,
            },
        });

        return unit;
    }

    async getUnitById(id: string) {
        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!unit) throw new AppError(404, 'Unit not found');
        return unit;
    }

    async updateUnit(id: string, data: UpdateUnitInput) {
        await this.getUnitById(id);
        return prisma.unit.update({
            where: { id },
            data,
        });
    }

    async deleteUnit(id: string) {
        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!unit) throw new AppError(404, 'Unit not found');

        if (unit._count.products > 0) {
            throw new AppError(
                409,
                `Cannot delete unit — it is linked to ${unit._count.products} product${unit._count.products === 1 ? '' : 's'}. Disable the unit instead.`,
            );
        }

        await prisma.unit.delete({ where: { id } });
        return { message: 'Unit deleted successfully' };
    }

    async listUnits({
        page = 1,
        limit = 10,
        search,
        is_active,
        display_on_pos,
    }: {
        page?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
        display_on_pos?: boolean;
    }) {
        const where: Prisma.UnitWhereInput = {};

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

        const [units, total] = await Promise.all([
            prisma.unit.findMany({
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
            prisma.unit.count({ where }),
        ]);

        return {
            data: units.map(u => ({
                ...u,
                product_count: u._count.products,
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