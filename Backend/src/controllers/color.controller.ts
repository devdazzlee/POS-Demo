import { Request, Response } from 'express';
import { ColorService } from '../services/color.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const colorService = new ColorService();

export const createColor = asyncHandler(async (req: Request, res: Response) => {
    const color = await colorService.createColor(req.body);
    new ApiResponse(color, 'Color created successfully', 201).send(res);
});

export const getColor = asyncHandler(async (req: Request, res: Response) => {
    const color = await colorService.getColorById(req.params.id);
    new ApiResponse(color, 'Color retrieved successfully').send(res);
});

export const updateColor = asyncHandler(async (req: Request, res: Response) => {
    const color = await colorService.updateColor(req.params.id, req.body);
    new ApiResponse(color, 'Color updated successfully').send(res);
});

export const listColors = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await colorService.listColors({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
    });

    new ApiResponse(result.data, 'Colors retrieved successfully', 200).send(res);
});

export const deleteColor = asyncHandler(async (req: Request, res: Response) => {
    const result = await colorService.deleteColor(req.params.id);
    new ApiResponse(null, result.message).send(res);
});