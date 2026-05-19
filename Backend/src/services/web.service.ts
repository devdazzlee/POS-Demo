import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { withCache, WEB_CACHE_TTL } from '../utils/webCache';
import { startOfMonth } from 'date-fns';

type SortKey = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const SORT_MAP: Record<SortKey, Prisma.ProductOrderByWithRelationInput> = {
  newest: { created_at: 'desc' },
  oldest: { created_at: 'asc' },
  'price-asc': { sales_rate_inc_dis_and_tax: 'asc' },
  'price-desc': { sales_rate_inc_dis_and_tax: 'desc' },
  'name-asc': { name: 'asc' },
  'name-desc': { name: 'desc' },
};

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  code: true,
  sku: true,
  description: true,
  sales_rate_exc_dis_and_tax: true,
  sales_rate_inc_dis_and_tax: true,
  discount_amount: true,
  is_featured: true,
  is_active: true,
  category_id: true,
  created_at: true,
  category: { select: { id: true, name: true, slug: true } },
  unit: { select: { id: true, name: true } },
  ProductImage: {
    where: { status: 'COMPLETE' as const },
    select: { image: true },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

const CATEGORY_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  code: true,
  is_active: true,
  CategoryImages: {
    where: { status: 'COMPLETE' as const },
    select: { image: true },
    take: 1,
  },
  _count: { select: { products: { where: { is_active: true } } } },
} satisfies Prisma.CategorySelect;

type ProductCard = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;
type CategoryCard = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_CARD_SELECT }>;

function shapeProduct(p: ProductCard) {
  const image = p.ProductImage?.[0]?.image ?? null;
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    sku: p.sku,
    description: p.description,
    price: p.sales_rate_inc_dis_and_tax,
    base_price: p.sales_rate_exc_dis_and_tax,
    discount_amount: p.discount_amount,
    is_featured: p.is_featured,
    is_active: p.is_active,
    category_id: p.category_id,
    category: p.category,
    unit: p.unit,
    image,
    images: p.ProductImage?.map((i) => i.image) ?? [],
    created_at: p.created_at,
  };
}

function shapeCategory(c: CategoryCard) {
  const image = c.CategoryImages?.[0]?.image ?? null;
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    code: c.code,
    is_active: c.is_active,
    image,
    product_count: c._count.products,
  };
}

function clampLimit(value: unknown, fallback: number, max = 100): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : (value as number);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function clampPage(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : (value as number);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

export class WebService {
  async getHome(opts: { featuredLimit?: number; bestLimit?: number; categoriesLimit?: number } = {}) {
    const featuredLimit = clampLimit(opts.featuredLimit, 8, 24);
    const bestLimit = clampLimit(opts.bestLimit, 8, 24);
    const categoriesLimit = clampLimit(opts.categoriesLimit, 6, 24);
    const cacheKey = `home:v2:f${featuredLimit}:b${bestLimit}:c${categoriesLimit}`;

    return withCache(cacheKey, WEB_CACHE_TTL.HOME, async () => {
      const [featured, bestSellers, categories, productCount, featuredTotal, categoriesTotal] =
        await Promise.all([
          this.loadFeatured(featuredLimit),
          this.loadBestSellers(bestLimit),
          this.loadHomeCategories(categoriesLimit),
          prisma.product.count({ where: { is_active: true } }),
          prisma.product.count({ where: { is_active: true, is_featured: true } }),
          prisma.category.count({ where: { is_active: true } }),
        ]);

      return {
        featuredProducts: featured,
        bestSellingProducts: bestSellers,
        categories,
        product_count: productCount,
        featured_total: featuredTotal,
        categories_total: categoriesTotal,
      };
    });
  }

  private async loadFeatured(limit: number) {
    const featured = await prisma.product.findMany({
      where: { is_featured: true, is_active: true },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: PRODUCT_CARD_SELECT,
    });

    if (featured.length >= limit) return featured.map(shapeProduct);

    const need = limit - featured.length;
    const excludeIds = featured.map((p) => p.id);
    const fillers = await prisma.product.findMany({
      where: {
        is_active: true,
        display_on_pos: true,
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
      },
      orderBy: { created_at: 'desc' },
      take: need,
      select: PRODUCT_CARD_SELECT,
    });

    return [...featured, ...fillers].map(shapeProduct);
  }

  private async loadBestSellers(limit: number) {
    const startDate = startOfMonth(new Date());
    const endDate = new Date();

    const bestSellers = await prisma.product.findMany({
      where: {
        is_active: true,
        order_items: { some: { created_at: { gte: startDate, lte: endDate } } },
      },
      orderBy: { order_items: { _count: 'desc' } },
      take: limit,
      select: PRODUCT_CARD_SELECT,
    });

    if (bestSellers.length >= limit) return bestSellers.map(shapeProduct);

    const need = limit - bestSellers.length;
    const excludeIds = bestSellers.map((p) => p.id);
    const fillers = await prisma.product.findMany({
      where: {
        is_active: true,
        display_on_pos: true,
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
      },
      orderBy: { created_at: 'desc' },
      take: need,
      select: PRODUCT_CARD_SELECT,
    });

    return [...bestSellers, ...fillers].map(shapeProduct);
  }

  private async loadHomeCategories(limit: number) {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: [{ products: { _count: 'desc' } }, { created_at: 'desc' }],
      take: limit,
      select: CATEGORY_CARD_SELECT,
    });
    return categories.map(shapeCategory);
  }

  async listCategories(opts: { page?: number; limit?: number; search?: string; all?: boolean }) {
    const all = !!opts.all;
    const limit = all ? 200 : clampLimit(opts.limit, 12, 50);
    const page = clampPage(opts.page);
    const search = (opts.search ?? '').trim();

    const cacheKey = all
      ? `categories:all`
      : `categories:p${page}:l${limit}:q${search.toLowerCase()}`;

    return withCache(cacheKey, WEB_CACHE_TTL.CATEGORIES_LIST, async () => {
      const where: Prisma.CategoryWhereInput = { is_active: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [rows, total] = await Promise.all([
        prisma.category.findMany({
          where,
          orderBy: [{ products: { _count: 'desc' } }, { created_at: 'desc' }],
          skip: all ? undefined : (page - 1) * limit,
          take: all ? undefined : limit,
          select: CATEGORY_CARD_SELECT,
        }),
        prisma.category.count({ where }),
      ]);

      return {
        data: rows.map(shapeCategory),
        meta: {
          total,
          page: all ? 1 : page,
          limit: all ? total : limit,
          totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
        },
      };
    });
  }

  async getCategoryBySlug(slug: string, opts: { page?: number; limit?: number; sort?: SortKey }) {
    const trimmed = slug?.trim();
    if (!trimmed) throw new AppError(400, 'Category slug is required');

    const limit = clampLimit(opts.limit, 12, 48);
    const page = clampPage(opts.page);
    const sort: SortKey = opts.sort && SORT_MAP[opts.sort] ? opts.sort : 'newest';
    const cacheKey = `category:${trimmed}:p${page}:l${limit}:s${sort}`;

    return withCache(cacheKey, WEB_CACHE_TTL.CATEGORY_DETAIL, async () => {
      const category = await prisma.category.findUnique({
        where: { slug: trimmed },
        select: CATEGORY_CARD_SELECT,
      });

      if (!category || !category.is_active) {
        throw new AppError(404, 'Category not found');
      }

      const productsWhere: Prisma.ProductWhereInput = {
        category_id: category.id,
        is_active: true,
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: productsWhere,
          orderBy: SORT_MAP[sort],
          skip: (page - 1) * limit,
          take: limit,
          select: PRODUCT_CARD_SELECT,
        }),
        prisma.product.count({ where: productsWhere }),
      ]);

      return {
        category: shapeCategory(category),
        products: products.map(shapeProduct),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          sort,
        },
      };
    });
  }

  async listProducts(opts: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    category_slug?: string;
    subcategory_id?: string;
    min_price?: number;
    max_price?: number;
    sort?: SortKey;
    featured?: boolean;
  }) {
    const limit = clampLimit(opts.limit, 12, 48);
    const page = clampPage(opts.page);
    const sort: SortKey = opts.sort && SORT_MAP[opts.sort] ? opts.sort : 'newest';
    const search = (opts.search ?? '').trim();

    const where: Prisma.ProductWhereInput = { is_active: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (opts.featured) where.is_featured = true;

    if (opts.category_id) {
      where.category_id = opts.category_id;
    } else if (opts.category_slug) {
      where.category = { slug: opts.category_slug };
    }

    if (opts.subcategory_id) where.subcategory_id = opts.subcategory_id;

    const min = typeof opts.min_price === 'number' && Number.isFinite(opts.min_price) ? opts.min_price : undefined;
    const max = typeof opts.max_price === 'number' && Number.isFinite(opts.max_price) ? opts.max_price : undefined;
    if (min !== undefined || max !== undefined) {
      where.sales_rate_inc_dis_and_tax = {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
      };
    }

    const cacheKey = `products:p${page}:l${limit}:s${sort}:q${search.toLowerCase()}:c${
      opts.category_id ?? opts.category_slug ?? ''
    }:sc${opts.subcategory_id ?? ''}:min${min ?? ''}:max${max ?? ''}:f${opts.featured ? 1 : 0}`;

    return withCache(cacheKey, WEB_CACHE_TTL.PRODUCT_LIST, async () => {
      const [rows, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: SORT_MAP[sort],
          skip: (page - 1) * limit,
          take: limit,
          select: PRODUCT_CARD_SELECT,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        data: rows.map(shapeProduct),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          sort,
        },
      };
    });
  }

  async getProductById(id: string) {
    const trimmed = id?.trim();
    if (!trimmed) throw new AppError(400, 'Product id is required');

    return withCache(`product:${trimmed}`, WEB_CACHE_TTL.PRODUCT_DETAIL, async () => {
      const product = await prisma.product.findUnique({
        where: { id: trimmed },
        select: {
          ...PRODUCT_CARD_SELECT,
          ProductImage: {
            where: { status: 'COMPLETE' as const },
            select: { image: true },
          },
          tax: { select: { id: true, name: true, percentage: true } },
          brand: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          stock: { select: { current_quantity: true, reserved_quantity: true } },
        },
      });

      if (!product || !product.is_active) {
        throw new AppError(404, 'Product not found');
      }

      const totalStock = (product.stock ?? []).reduce(
        (sum, s) => sum + Number(s.current_quantity ?? 0) - Number(s.reserved_quantity ?? 0),
        0
      );

      const shaped = shapeProduct(product as ProductCard);
      return {
        ...shaped,
        images: product.ProductImage?.map((i) => i.image) ?? [],
        tax: product.tax,
        brand: product.brand,
        subcategory: product.subcategory,
        in_stock: totalStock > 0,
        available_stock: totalStock,
      };
    });
  }

  async suggestProducts(query: string, limit = 8) {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const safeLimit = clampLimit(limit, 8, 20);
    const cacheKey = `suggest:${trimmed.toLowerCase()}:l${safeLimit}`;

    return withCache(cacheKey, WEB_CACHE_TTL.SEARCH_SUGGEST, async () => {
      const rows = await prisma.product.findMany({
        where: {
          is_active: true,
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { sku: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        orderBy: { created_at: 'desc' },
        take: safeLimit,
        select: {
          id: true,
          name: true,
          sales_rate_inc_dis_and_tax: true,
          category: { select: { id: true, name: true, slug: true } },
          ProductImage: {
            where: { status: 'COMPLETE' as const },
            select: { image: true },
            take: 1,
          },
        },
      });

      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.sales_rate_inc_dis_and_tax,
        category: p.category,
        image: p.ProductImage?.[0]?.image ?? null,
      }));
    });
  }

  async getProductCount() {
    return withCache('meta:product-count', WEB_CACHE_TTL.PRODUCT_COUNT, async () => {
      const count = await prisma.product.count({ where: { is_active: true } });
      return { count };
    });
  }
}

export default WebService;
