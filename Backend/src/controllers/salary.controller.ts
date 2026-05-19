import { Request, Response } from 'express';
import { SalaryService } from '../services/salary.service';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const salaryService = new SalaryService();

export const createSalary = asyncHandler(async (req: Request, res: Response) => {
  const salary = await salaryService.createSalary(req.body);
  new ApiResponse(salary, 'Salary record created successfully', 201).send(res);
});

export const listSalaries = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await salaryService.listSalaries(req.user?.branch_id!, Number(page), Number(limit));
  new ApiResponse(result.data, 'Salaries fetched successfully', 200).send(res);
});

export const updateSalary = asyncHandler(async (req: Request, res: Response) => {
  const salary = await salaryService.updateSalary(req.params.id, req.body);
  new ApiResponse(salary, 'Salary record updated successfully').send(res);
});

export const deleteSalary = asyncHandler(async (req: Request, res: Response) => {
  await salaryService.deleteSalary(req.params.id);
  new ApiResponse(null, 'Salary record deleted successfully').send(res);
});
