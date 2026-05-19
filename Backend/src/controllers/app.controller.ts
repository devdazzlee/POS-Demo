import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import AppService from "../services/app.service";
import { ApiResponse } from "../utils/apiResponse";

const appService = new AppService();

export const getHomeData = asyncHandler(async (req: Request, res: Response) => {
    const homeData = await appService.getHomeData();
    new ApiResponse(homeData, 'Data fetched successfully', 200).send(res);
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const searchQuery = req.query.search as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const searchedProducts = await appService.searchProducts(searchQuery, limit);
    new ApiResponse(searchedProducts, 'Data fetched successfully', 200).send(res);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await appService.getProductById(req.params.id);
    new ApiResponse(product, 'Product fetched successfully', 200).send(res);
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await appService.getCategories();
    new ApiResponse(categories, 'Categories fetched successfully', 200).send(res);
});