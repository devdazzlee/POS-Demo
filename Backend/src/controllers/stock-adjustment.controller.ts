import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { StockAdjustmentService } from '../services/stock-adjustment.service';

const adjustmentService = new StockAdjustmentService();

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const adjustment = await adjustmentService.createAdjustment({
    ...req.body,
    adjustedBy: req.user!.id,
  });
  new ApiResponse(adjustment, 'Stock adjustment created successfully', 201).send(res);
});

export const listAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;
  const result = await adjustmentService.listAdjustments({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    productId: query.productId,
    branchId: query.branchId,
    startDate,
    endDate,
  });
  new ApiResponse(result.data, 'Adjustments retrieved', 200, true, result.meta).send(res);
});
