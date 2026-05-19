import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateCategoryInput, UpdateCategoryInput } from '../validations/category.validation';
import { s3Service } from './common/s3BucketService';

export class CategoryService {
  async createCategory(data: CreateCategoryInput) {
    const [existingSlug, allCategories] = await Promise.all([
      prisma.category.findUnique({
        where: { slug: data.slug },
      }),
      prisma.category.findMany({
        select: { code: true },
      }),
    ]);

    if (existingSlug) {
      throw new AppError(400, 'Category with this slug already exists');
    }

    // Generate new code by finding the highest numeric code
    let maxCode = 999;
    allCategories.forEach(cat => {
      const codeNum = parseInt(cat.code, 10);
      if (!isNaN(codeNum) && codeNum.toString() === cat.code) {
        if (codeNum > maxCode) maxCode = codeNum;
      }
    });
    
    const newCode = (maxCode + 1).toString();

    // First create without code
    const category = await prisma.category.create({
      data: {
        ...data,
        code: newCode, // Temporary empty value
        display_on_branches: data.display_on_branches || [],
      },
    });

    return category;
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
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
      throw new AppError(404, 'Category not found');
    }

    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await this.getCategoryById(id);

    // Check if new slug conflicts with existing
    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw new AppError(400, 'Category with this slug already exists');
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        display_on_branches: data.display_on_branches || category.display_on_branches,
      },
    });
  }

  async toggleCategoryStatus(id: string) {
    const category = await this.getCategoryById(id);
    return prisma.category.update({
      where: { id },
      data: { is_active: !category.is_active },
    });
  }

  async listCategories({
    page = 1,
    limit,
    search,
    is_active,
    branch_id,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    branch_id?: string;
  }) {
    const where: Prisma.CategoryWhereInput = {};

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

    const shouldPaginate =
      typeof limit === 'number' && Number.isFinite(limit) && limit > 0;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
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
      prisma.category.count({ where }),
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
    return await prisma.category.findMany({
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

  async processCategoryImages(categoryId: string, files: Express.Multer.File[]) {
    try {
      console.log('Processing category images service');
      
      // 1. Upload images to S3
      const imageUrls = await s3Service.uploadMultipleImages(files);
      console.log('Uploaded images to S3:', imageUrls);
      
      // 2. Create image records with status COMPLETE
      await prisma.categoryImages.createMany({
        data: imageUrls.map(url => ({
          category_id: categoryId,
          image: url,
          status: 'COMPLETE',
        }))
      });

      console.log('Category images processed successfully:', imageUrls);

    } catch (error) {
      console.log('Error processing category images:', error);
      const err = error as Error;

      // 3. On failure, create FAILED image records with error messages
      await prisma.categoryImages.createMany({
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

  async deleteCategory(id: string) {
    const category = await this.getCategoryById(id);

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category_id: id },
    });

    if (productCount > 0) {
      throw new AppError(400, `Cannot delete category "${category.name}" — it has ${productCount} product(s). Remove or reassign them first.`);
    }

    // Delete images first, then the category
    await prisma.$transaction(async (tx) => {
      await tx.categoryImages.deleteMany({ where: { category_id: id } });
      await tx.category.delete({ where: { id } });
    });

    return category;
  }

  async deleteAllCategories(): Promise<{ 
    deletedCount: number; 
    deletedImages: number;
  }> {
    // Delete all categories and their related records in a transaction
    return await prisma.$transaction(async (tx) => {
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