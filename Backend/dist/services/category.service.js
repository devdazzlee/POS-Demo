"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const s3BucketService_1 = require("./common/s3BucketService");
class CategoryService {
    async createCategory(data) {
        const [existingSlug, allCategories] = await Promise.all([
            client_1.prisma.category.findUnique({
                where: { slug: data.slug },
            }),
            client_1.prisma.category.findMany({
                select: { code: true },
            }),
        ]);
        if (existingSlug) {
            throw new apiError_1.AppError(400, 'Category with this slug already exists');
        }
        // Generate new code by finding the highest numeric code
        let maxCode = 999;
        allCategories.forEach(cat => {
            const codeNum = parseInt(cat.code, 10);
            if (!isNaN(codeNum) && codeNum.toString() === cat.code) {
                if (codeNum > maxCode)
                    maxCode = codeNum;
            }
        });
        const newCode = (maxCode + 1).toString();
        // First create without code
        const category = await client_1.prisma.category.create({
            data: {
                ...data,
                code: newCode, // Temporary empty value
                display_on_branches: data.display_on_branches || [],
            },
        });
        return category;
    }
    async getCategoryById(id) {
        const category = await client_1.prisma.category.findUnique({
            where: { id },
            include: {
                branch: true,
                products: {
                    where: { is_active: true },
                    select: { id: true, name: true },
                },
            },
        });
        if (!category) {
            throw new apiError_1.AppError(404, 'Category not found');
        }
        return category;
    }
    async updateCategory(id, data) {
        const category = await this.getCategoryById(id);
        // Check if new slug conflicts with existing
        if (data.slug && data.slug !== category.slug) {
            const existingSlug = await client_1.prisma.category.findUnique({
                where: { slug: data.slug },
            });
            if (existingSlug) {
                throw new apiError_1.AppError(400, 'Category with this slug already exists');
            }
        }
        return client_1.prisma.category.update({
            where: { id },
            data: {
                ...data,
                display_on_branches: data.display_on_branches || category.display_on_branches,
            },
        });
    }
    async toggleCategoryStatus(id) {
        const category = await this.getCategoryById(id);
        return client_1.prisma.category.update({
            where: { id },
            data: { is_active: !category.is_active },
        });
    }
    async listCategories({ page = 1, limit, search, is_active, branch_id, }) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (branch_id) {
            where.branch_id = branch_id;
        }
        const shouldPaginate = typeof limit === 'number' && Number.isFinite(limit) && limit > 0;
        const [categories, total] = await Promise.all([
            client_1.prisma.category.findMany({
                where,
                skip: shouldPaginate ? (page - 1) * limit : undefined,
                take: shouldPaginate ? limit : undefined,
                orderBy: { created_at: 'desc' },
                include: {
                    branch: {
                        select: { id: true, name: true, code: true },
                    },
                    _count: {
                        select: { products: true },
                    },
                },
            }),
            client_1.prisma.category.count({ where }),
        ]);
        return {
            data: categories.map(c => ({
                ...c,
                product_count: c._count.products,
                _count: undefined,
            })),
            meta: {
                total,
                page,
                limit: shouldPaginate ? limit : total,
                totalPages: shouldPaginate ? Math.ceil(total / limit) : 1,
            },
        };
    }
    async getCategories() {
        // Fetch categories from the database
        return await client_1.prisma.category.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                created_at: "desc",
            },
            include: {
                CategoryImages: {
                    where: {
                        status: 'COMPLETE',
                    },
                    select: {
                        image: true,
                    }
                },
            },
        });
    }
    async processCategoryImages(categoryId, files) {
        try {
            console.log('Processing category images service');
            // 1. Upload images to S3
            const imageUrls = await s3BucketService_1.s3Service.uploadMultipleImages(files);
            console.log('Uploaded images to S3:', imageUrls);
            // 2. Create image records with status COMPLETE
            await client_1.prisma.categoryImages.createMany({
                data: imageUrls.map(url => ({
                    category_id: categoryId,
                    image: url,
                    status: 'COMPLETE',
                }))
            });
            console.log('Category images processed successfully:', imageUrls);
        }
        catch (error) {
            console.log('Error processing category images:', error);
            const err = error;
            // 3. On failure, create FAILED image records with error messages
            await client_1.prisma.categoryImages.createMany({
                data: files.map(file => ({
                    category_id: categoryId,
                    image: `failed-${file.originalname}`, // Placeholder image value
                    status: 'FAILED',
                    error: err.message.substring(0, 255), // Truncated error message
                }))
            });
            throw error;
        }
    }
    async deleteCategory(id) {
        const category = await this.getCategoryById(id);
        // Check if category has products
        const productCount = await client_1.prisma.product.count({
            where: { category_id: id },
        });
        if (productCount > 0) {
            throw new apiError_1.AppError(400, `Cannot delete category "${category.name}" — it has ${productCount} product(s). Remove or reassign them first.`);
        }
        // Delete images first, then the category
        await client_1.prisma.$transaction(async (tx) => {
            await tx.categoryImages.deleteMany({ where: { category_id: id } });
            await tx.category.delete({ where: { id } });
        });
        return category;
    }
    async deleteAllCategories() {
        // Delete all categories and their related records in a transaction
        return await client_1.prisma.$transaction(async (tx) => {
            // 1. Delete CategoryImages records first (ON DELETE RESTRICT constraint)
            const deletedImages = await tx.categoryImages.deleteMany({});
            // 2. Delete all Categories
            const deletedCategories = await tx.category.deleteMany({});
            return {
                deletedCount: deletedCategories.count,
                deletedImages: deletedImages.count,
            };
        });
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map