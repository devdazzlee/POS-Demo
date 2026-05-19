import { Request, Response } from 'express';
import { ShiftService } from '../services/shift.service';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const shiftService = new ShiftService();

export const createShift = asyncHandler(async (req: Request, res: Response) => {
  const shift = await shiftService.createShift(req.body);
  new ApiResponse(shift, 'Shift created successfully', 201).send(res);
});

export const listShifts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await shiftService.listShifts({ page: Number(page), limit: Number(limit) });
  new ApiResponse(result.data, 'Shifts retrieved successfully', 200).send(res);
});

export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedShift = await shiftService.updateShift(id, req.body);
  new ApiResponse(updatedShift, 'Shift updated successfully', 200).send(res);
});

export const deleteShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await shiftService.deleteShift(id);
  new ApiResponse(null, 'Shift deleted successfully', 200).send(res);
});
