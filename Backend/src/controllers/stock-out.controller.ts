import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { StockOutService } from '../services/stock-out.service';

const stockOutService = new StockOutService();

export const logStockOut = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockOutService.logStockOut({
    ...req.body,
    createdBy: req.user!.id,
  });
  new ApiResponse(result, 'Stock out logged successfully').send(res);
});

export const logBulkStockOut = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockOutService.logBulkStockOut({
    ...req.body,
    createdBy: req.user!.id,
  });
  new ApiResponse(result, 'Bulk stock-out dispatched successfully').send(res);
});

export const listStockOut = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as any;
  const result = await stockOutService.listStockOutMovements({
    page: q.page ? Number(q.page) : undefined,
    limit: q.limit ? Number(q.limit) : undefined,
    reason: q.reason,
    branchId: q.branchId,
    productId: q.productId,
    startDate: q.startDate ? new Date(q.startDate) : undefined,
    endDate: q.endDate ? new Date(q.endDate) : undefined,
  });
  new ApiResponse(result.data, 'Stock-out history fetched', 200, true, result.meta).send(res);
});

export const logReturn = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockOutService.logReturn({
    ...req.body,
    createdBy: req.user!.id,
  });
  new ApiResponse(result, 'Return logged successfully').send(res);
});
