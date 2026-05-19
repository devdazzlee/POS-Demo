import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const authService = new AuthService();

const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  new ApiResponse(user, 'IUser registered successfully', 201).send(res);
});

const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.registerAdmin(req.body);
  new ApiResponse(user, 'IUser registered successfully', 201).send(res);
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const userWithToken = await authService.login(email, password);
  new ApiResponse({ ...userWithToken }, 'Login successful').send(res);
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user?.id!);
  new ApiResponse(null, 'Logout successful').send(res);
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  new ApiResponse(req.user, 'Current user fetched').send(res);
});

export { register, login, logout, registerAdmin, getCurrentUser };
