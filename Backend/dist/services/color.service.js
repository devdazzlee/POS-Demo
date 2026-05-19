"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
class ColorService {
    async createColor(data) {
        const [existingColor, allColors] = await Promise.all([
            client_1.prisma.color.findFirst({
                where: {
                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },
                },
            }),
            client_1.prisma.color.findMany({
                select: { code: true },
            }),
        ]);
        if (existingColor)
            throw new apiError_1.AppError(400, 'Color already exists');
        const maxCode = allColors.reduce((max, c) => {
            const parsed = parseInt(c.code, 10);
            return Number.isFinite(parsed) && parsed > max ? parsed : max;
        }, 999);
        const newCode = (maxCode + 1).toString();
        const color = await client_1.prisma.color.create({
            data: {
                ...data,
                code: newCode
            },
        });
        return color;
    }
    async getColorById(id) {
        const color = await client_1.prisma.color.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!color)
            throw new apiError_1.AppError(404, 'Color not found');
        return color;
    }
    async updateColor(id, data) {
        await this.getColorById(id); // Verify exists
        return client_1.prisma.color.update({
            where: { id },
            data,
        });
    }
    async listColors({ page = 1, limit = 10, search, }) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [colors, total] = await Promise.all([
            client_1.prisma.color.findMany({
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
            client_1.prisma.color.count({ where }),
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
    async deleteColor(id) {
        const color = await client_1.prisma.color.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!color)
            throw new apiError_1.AppError(404, 'Color not found');
        if (color._count.products > 0) {
            throw new apiError_1.AppError(409, `Cannot delete color — it is linked to ${color._count.products} product${color._count.products === 1 ? '' : 's'}. Disable the color instead.`);
        }
        await client_1.prisma.color.delete({ where: { id } });
        return { message: 'Color deleted successfully' };
    }
}
exports.ColorService = ColorService;
//# sourceMappingURL=color.service.js.map