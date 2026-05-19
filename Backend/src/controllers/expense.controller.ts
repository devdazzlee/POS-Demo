import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const expenseService = new ExpenseService();

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.createExpense(req.body);
    new ApiResponse(expense, 'Expense created successfully', 201).send(res);
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await expenseService.listExpenses({
        page: Number(page),
        limit: Number(limit),
    });
    new ApiResponse(result.data, 'Expenses retrieved successfully', 200).send(res);
});

export const createEmployeeType = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.create(req.body);
  new ApiResponse(data, 'Employee type created successfully', 201).send(res);
});

export const getEmployeeTypes = asyncHandler(async (_req: Request, res: Response) => {
  const data = await expenseService.getAll();
  new ApiResponse(data, 'Employee types retrieved successfully').send(res);
});

export const getEmployeeTypeById = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.getById(req.params.id);
  new ApiResponse(data, 'Employee type retrieved successfully').send(res);
});

export const updateEmployeeType = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.update(req.params.id, req.body);
  new ApiResponse(data, 'Employee type updated successfully').send(res);
});

export const deleteEmployeeType = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.delete(req.params.id);
  new ApiResponse(data, 'Employee type deleted successfully').send(res);
});

