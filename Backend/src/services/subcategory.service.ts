import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateSubcategoryInput, UpdateSubcategoryInput } from '../validations/subcategory.validation';

export class SubcategoryService {
    async createSubcategory(data: CreateSubcategoryInput) {
        const existingSubcategory = await prisma.subcategory.findFirst({
            where: {
                name: data.name,
                is_active: true,
            },
        });

        if (existingSubcategory) {
            throw new AppError(400, 'Subcategory with this name already exists');
        }

        const lastSubcategory = await prisma.subcategory.findFirst({
            orderBy: { created_at: 'desc' },
            select: { code: true },
        });

        const newCode = lastSubcategory
            ? (parseInt(lastSubcategory.code) + 1).toString()
            : '1000';

        // First create without code
        const subcategory = await prisma.subcategory.create({
            data: {
                ...data,
                code: newCode, // Temporary empty value
            },
        });
        return subcategory;
    }

    async getSubcategoryById(id: string) {
        const subcategory = await prisma.subcategory.findUnique({
            where: { id },
            include: {
                products: {
                    where: { is_active: true },
                    select: { id: true, name: true },
                },
            },
        });

        if (!subcategory) {
            throw new AppError(404, 'Subcategory not found');
        }

        return subcategory;
    }

    async updateSubcategory(id: string, data: UpdateSubcategoryInput) {
        await this.getSubcategoryById(id); // Verify exists

        return prisma.subcategory.update({
            where: { id },
            data,
        });
    }

    async toggleSubcategoryStatus(id: string) {
        const subcategory = await this.getSubcategoryById(id);
        return prisma.subcategory.update({
            where: { id },
            data: { is_active: !subcategory.is_active },
        });
    }

    async listSubcategories({
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
        const where: Prisma.SubcategoryWhereInput = {};

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

        const [subcategories, total] = await Promise.all([
            prisma.subcategory.findMany({
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
            prisma.subcategory.count({ where }),
        ]);

        return {
            data: subcategories.map(s => ({
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