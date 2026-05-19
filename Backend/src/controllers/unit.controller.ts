import { Request, Response } from 'express';
import { UnitService } from '../services/unit.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const unitService = new UnitService();

export const createUnit = asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.createUnit(req.body);
    new ApiResponse(unit, 'Unit created successfully', 201).send(res);
});

export const getUnit = asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.getUnitById(req.params.id);
    new ApiResponse(unit, 'Unit retrieved successfully').send(res);
});

export const updateUnit = asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.updateUnit(req.params.id, req.body);
    new ApiResponse(unit, 'Unit updated successfully').send(res);
});


export const listUnits = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await unitService.listUnits({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
    });

    new ApiResponse(result.data, 'Units retrieved successfully', 200).send(res);
});

export const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
    const result = await unitService.deleteUnit(req.params.id);
    new ApiResponse(null, result.message).send(res);
});