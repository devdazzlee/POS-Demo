import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateColorInput, UpdateColorInput } from '../validations/color.validation';

export class ColorService {
    async createColor(data: CreateColorInput) {
        const [existingColor, allColors] = await Promise.all([
            prisma.color.findFirst({
                where: {
                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },
                },
            }),
            prisma.color.findMany({
                select: { code: true },
            }),
        ]);

        if (existingColor) throw new AppError(400, 'Color already exists');

        const maxCode = allColors.reduce((max, c) => {
            const parsed = parseInt(c.code, 10);
            return Number.isFinite(parsed) && parsed > max ? parsed : max;
        }, 999);
        const newCode = (maxCode + 1).toString();

        const color = await prisma.color.create({
            data: {
                ...data,
                code: newCode
            },
        });

        return color;
    }

    async getColorById(id: string) {
        const color = await prisma.color.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!color) throw new AppError(404, 'Color not found');
        return color;
    }

    async updateColor(id: string, data: UpdateColorInput) {
        await this.getColorById(id); // Verify exists
        return prisma.color.update({
            where: { id },
            data,
        });
    }

    async listColors({
        page = 1,
        limit = 10,
        search,
    }: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const where: Prisma.ColorWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [colors, total] = await Promise.all([
            prisma.color.findMany({
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
            prisma.color.count({ where }),
        ]);

        return {
            data: colors.map(c => ({
                ...c,
                product_count: c._count.products,
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

    async deleteColor(id: string) {
        const color = await prisma.color.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!color) throw new AppError(404, 'Color not found');

        if (color._count.products > 0) {
            throw new AppError(
                409,
                `Cannot delete color — it is linked to ${color._count.products} product${color._count.products === 1 ? '' : 's'}. Disable the color instead.`,
            );
        }

        await prisma.color.delete({ where: { id } });
        return { message: 'Color deleted successfully' };
    }
}