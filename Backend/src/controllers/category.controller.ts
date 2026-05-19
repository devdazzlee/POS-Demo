import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const categoryService = new CategoryService();

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  new ApiResponse(category, 'Category created successfully', 201).send(res);
  console.log(req.files);
  
  if (req.files?.length) {
    console.log('Processing category images:');
    
    await categoryService.processCategoryImages(
      category.id,
      req.files as Express.Multer.File[]
    )
  }
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);
  new ApiResponse(category, 'Category retrieved successfully').send(res);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  new ApiResponse(category, 'Category updated successfully').send(res);
});

export const toggleCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.toggleCategoryStatus(req.params.id);
  new ApiResponse(null, 'Category status changed successfully').send(res);
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit, search, is_active, branch_id } = req.query;

  const parsedLimit =
    typeof limit === 'string' && limit.trim() !== '' ? Number(limit) : undefined;

  const result = await categoryService.listCategories({
    page: Number(page),
    limit: parsedLimit,
    search: search as string | undefined,
    is_active: is_active ? is_active === 'true' : undefined,
    branch_id: branch_id as string | undefined,
  });

  new ApiResponse(result.data, 'Categories retrieved successfully', 200).send(res);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.deleteCategory(req.params.id);
  new ApiResponse(category, 'Category deleted successfully').send(res);
});

export const deleteAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.deleteAllCategories();
  new ApiResponse(
    result, 
    `Successfully deleted ${result.deletedCount} categories and ${result.deletedImages} category images`,
    200
  ).send(res);
});