import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateBrandInput, UpdateBrandInput } from '../validations/brand.validation';

export class BrandService {
    async createBrand(data: CreateBrandInput) {
        const [existingBrand, allBrands] = await Promise.all([
            prisma.brand.findFirst({
                where: {
                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },
                },
            }),
            prisma.brand.findMany({
                select: { code: true },
            }),
        ]);

        if (existingBrand) {
            throw new AppError(400, 'Brand with this name already exists');
        }

        const maxCode = allBrands.reduce((max, b) => {
            const parsed = parseInt(b.code, 10);
            return Number.isFinite(parsed) && parsed > max ? parsed : max;
        }, 999);
        const newCode = (maxCode + 1).toString();

        return prisma.brand.create({
            data: {
                ...data,
                code: newCode,
            },
        });
    }

    async getBrandById(id: string) {
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!brand) throw new AppError(404, 'Brand not found');
        return brand;
    }

    async updateBrand(id: string, data: UpdateBrandInput) {
        await this.getBrandById(id); // Verify exists
        return prisma.brand.update({
            where: { id },
            data,
        });
    }

    async toggleBrandDisplay(id: string) {
        const brand = await this.getBrandById(id);
        return prisma.brand.update({
            where: { id },
            data: { display_on_pos: !brand.display_on_pos },
        });
    }

    async listBrands({
        page = 1,
        limit = 10,
        search,
    }: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const where: Prisma.BrandWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [brands, total] = await Promise.all([
            prisma.brand.findMany({
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
            prisma.brand.count({ where }),
        ]);

        return {
            data: brands.map(b => ({
                ...b,
                product_count: b._count.products,
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

    async deleteBrand(id: string) {
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!brand) throw new AppError(404, 'Brand not found');

        if (brand._count.products > 0) {
            throw new AppError(
                409,
                `Cannot delete brand — it is linked to ${brand._count.products} product${brand._count.products === 1 ? '' : 's'}. Disable the brand instead.`,
            );
        }

        await prisma.brand.delete({ where: { id } });
        return { message: 'Brand deleted successfully' };
    }
}