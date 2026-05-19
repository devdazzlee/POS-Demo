import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import WebService from '../services/web.service';
import { ApiResponse } from '../utils/apiResponse';

const webService = new WebService();

const parseBool = (v: unknown): boolean | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === 'true' || v === '1' || v === 1 || v === true) return true;
  if (v === 'false' || v === '0' || v === 0 || v === false) return false;
  return undefined;
};

const parseNumber = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
};

export const getHome = asyncHandler(async (req: Request, res: Response) => {
  const data = await webService.getHome({
    featuredLimit: parseNumber(req.query.featured_limit),
    bestLimit: parseNumber(req.query.best_limit),
    categoriesLimit: parseNumber(req.query.categories_limit),
  });
  new ApiResponse(data, 'Home data fetched successfully', 200).send(res);
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const all = parseBool(req.query.all);
  const result = await webService.listCategories({
    page: parseNumber(req.query.page),
    limit: parseNumber(req.query.limit),
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    all,
  });
  new ApiResponse(result.data, 'Categories fetched successfully', 200, true, result.meta).send(res);
});

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const result = await webService.listCategories({ all: true });
  new ApiResponse(result.data, 'Categories fetched successfully', 200, true, result.meta).send(res);
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await webService.getCategoryBySlug(req.params.slug, {
    page: parseNumber(req.query.page),
    limit: parseNumber(req.query.limit),
    sort: req.query.sort as any,
  });
  new ApiResponse(data, 'Category fetched successfully', 200).send(res);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await webService.listProducts({
    page: parseNumber(req.query.page),
    limit: parseNumber(req.query.limit),
    search: typeof req.query.search === 'string' ? req.query.search : (req.query.q as string | undefined),
    category_id: typeof req.query.category_id === 'string' ? req.query.category_id : undefined,
    category_slug: typeof req.query.category === 'string' ? req.query.category : undefined,
    subcategory_id: typeof req.query.subcategory_id === 'string' ? req.query.subcategory_id : undefined,
    min_price: parseNumber(req.query.min_price),
    max_price: parseNumber(req.query.max_price),
    sort: req.query.sort as any,
    featured: parseBool(req.query.featured),
  });
  new ApiResponse(result.data, 'Products fetched successfully', 200, true, result.meta).send(res);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await webService.getProductById(req.params.id);
  new ApiResponse(product, 'Product fetched successfully', 200).send(res);
});

export const suggestProducts = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const limit = parseNumber(req.query.limit) ?? 8;
  const suggestions = await webService.suggestProducts(q, limit);
  new ApiResponse(suggestions, 'Suggestions fetched successfully', 200).send(res);
});

export const getProductCount = asyncHandler(async (_req: Request, res: Response) => {
  const data = await webService.getProductCount();
  new ApiResponse(data, 'Product count fetched successfully', 200).send(res);
});
