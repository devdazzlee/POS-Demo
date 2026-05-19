import { Request, Response } from 'express';
import { TaxService } from '../services/tax.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const taxService = new TaxService();

export const createTax = asyncHandler(async (req: Request, res: Response) => {
    const tax = await taxService.createTax(req.body);
    new ApiResponse(tax, 'Tax created successfully', 201).send(res);
});

export const getTax = asyncHandler(async (req: Request, res: Response) => {
    const tax = await taxService.getTaxById(req.params.id);
    new ApiResponse(tax, 'Tax retrieved successfully').send(res);
});

export const updateTax = asyncHandler(async (req: Request, res: Response) => {
    const tax = await taxService.updateTax(req.params.id, req.body);
    new ApiResponse(tax, 'Tax updated successfully').send(res);
});

export const toggletaxestatus = asyncHandler(async (req: Request, res: Response) => {
    await taxService.toggletaxestatus(req.params.id);
    new ApiResponse(null, 'Tax status changed successfully').send(res);
});

export const listTaxes = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, is_active } = req.query;

    const result = await taxService.listTaxes({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
        is_active: is_active ? is_active === 'true' : undefined,
    });

    new ApiResponse(result.data, 'Taxes retrieved successfully', 200).send(res);
});