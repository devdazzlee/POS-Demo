import { Request, Response } from 'express';
import { BrandService } from '../services/brand.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const brandService = new BrandService();

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
    const brand = await brandService.createBrand(req.body);
    new ApiResponse(brand, 'Brand created successfully', 201).send(res);
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
    const brand = await brandService.getBrandById(req.params.id);
    new ApiResponse(brand, 'Brand retrieved successfully').send(res);
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    new ApiResponse(brand, 'Brand updated successfully').send(res);
});

export const toggleBrandDisplay = asyncHandler(async (req: Request, res: Response) => {
    await brandService.toggleBrandDisplay(req.params.id);
    new ApiResponse(null, 'Brand display status changed successfully').send(res);
});

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await brandService.listBrands({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
    });

    new ApiResponse(result.data, 'Brands retrieved successfully', 200).send(res);
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
    const result = await brandService.deleteBrand(req.params.id);
    new ApiResponse(null, result.message).send(res);
});