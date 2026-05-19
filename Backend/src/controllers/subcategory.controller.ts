import { Request, Response } from 'express';
import { SubcategoryService } from '../services/subcategory.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const subcategoryService = new SubcategoryService();

export const createSubcategory = asyncHandler(async (req: Request, res: Response) => {
    const subcategory = await subcategoryService.createSubcategory(req.body);
    new ApiResponse(subcategory, 'Subcategory created successfully', 201).send(res);
});

export const getSubcategory = asyncHandler(async (req: Request, res: Response) => {
    const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
    new ApiResponse(subcategory, 'Subcategory retrieved successfully').send(res);
});

export const updateSubcategory = asyncHandler(async (req: Request, res: Response) => {
    const subcategory = await subcategoryService.updateSubcategory(req.params.id, req.body);
    new ApiResponse(subcategory, 'Subcategory updated successfully').send(res);
});

export const toggleSubcategoryStatus = asyncHandler(async (req: Request, res: Response) => {
    await subcategoryService.toggleSubcategoryStatus(req.params.id);
    new ApiResponse(null, 'Subcategory status changed successfully').send(res);
});

export const listSubcategories = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, is_active } = req.query;

    const result = await subcategoryService.listSubcategories({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
        is_active: is_active ? is_active === 'true' : undefined,
    });

    new ApiResponse(result.data, 'Subcategories retrieved successfully', 200).send(res);
});