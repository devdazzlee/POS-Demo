import { Request, Response } from 'express';
import { ShiftAssignmentService } from '../services/shiftAssignment.service';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const shiftAssignmentService = new ShiftAssignmentService();

export const assignShift = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id, shift_time, start_date, end_date, break_time } = req.body;
  const assignment = await shiftAssignmentService.assignShift({
    employee_id,
    shift_time,
    start_date: new Date(start_date),
    end_date: end_date ? new Date(end_date) : null,
    break_time,
  });
  new ApiResponse(assignment, 'Shift assigned successfully', 201).send(res);
});

export const getCurrentShift = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  const currentShift = await shiftAssignmentService.getCurrentShift(employee_id);
  new ApiResponse(currentShift, 'Current shift fetched successfully', 200).send(res);
});

export const getShiftHistory = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  const history = await shiftAssignmentService.getShiftHistory(employee_id);
  new ApiResponse(history, 'Shift history fetched successfully', 200).send(res);
});

export const endCurrentShift = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  const { sales } = req.body;
  await shiftAssignmentService.endCurrentShift(employee_id, new Date(), sales !== undefined ? parseFloat(sales) : undefined);
  new ApiResponse(null, 'Current shift ended successfully', 200).send(res);
});

export const getAllShifts = asyncHandler(async (req: Request, res: Response) => {
  const shifts = await shiftAssignmentService.getAllShifts();
  new ApiResponse(shifts, 'All shifts fetched successfully', 200).send(res);
});

export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { shift_time, start_date, end_date, sales, break_time } = req.body;
  const updated = await shiftAssignmentService.updateShift(id, {
    shift_time,
    start_date: start_date ? new Date(start_date) : undefined,
    end_date: end_date === null ? null : (end_date ? new Date(end_date) : undefined),
    sales: sales !== undefined ? parseFloat(sales) : undefined,
    break_time,
  });
  new ApiResponse(updated, 'Shift updated successfully', 200).send(res);
});

export const deleteShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await shiftAssignmentService.deleteShift(id);
  new ApiResponse(null, 'Shift deleted successfully', 200).send(res);
});
