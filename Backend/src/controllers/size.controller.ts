import { Request, Response } from 'express';
import { SizeService } from '../services/size.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const sizeService = new SizeService();

export const createSize = asyncHandler(async (req: Request, res: Response) => {
    const size = await sizeService.createSize(req.body);
    new ApiResponse(size, 'Size created successfully', 201).send(res);
});

export const getSize = asyncHandler(async (req: Request, res: Response) => {
    const size = await sizeService.getSizeById(req.params.id);
    new ApiResponse(size, 'Size retrieved successfully').send(res);
});

export const updateSize = asyncHandler(async (req: Request, res: Response) => {
    const size = await sizeService.updateSize(req.params.id, req.body);
    new ApiResponse(size, 'Size updated successfully').send(res);
});

export const listSizes = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await sizeService.listSizes({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
    });

    new ApiResponse(result.data, 'Sizes retrieved successfully', 200).send(res);
});

export const deleteSize = asyncHandler(async (req: Request, res: Response) => {
    const result = await sizeService.deleteSize(req.params.id);
    new ApiResponse(null, result.message).send(res);
});