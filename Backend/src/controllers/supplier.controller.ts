import { Request, Response } from 'express';
import { SupplierService } from '../services/supplier.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const supplierService = new SupplierService();

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.createSupplier(req.body);
    new ApiResponse(supplier, 'Supplier created successfully', 201).send(res);
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.getSupplierById(req.params.id);
    new ApiResponse(supplier, 'Supplier retrieved successfully').send(res);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    new ApiResponse(supplier, 'Supplier updated successfully').send(res);
});

export const toggleSupplierStatus = asyncHandler(async (req: Request, res: Response) => {
    await supplierService.toggleSupplierStatus(req.params.id);
    new ApiResponse(null, 'Supplier status changed successfully').send(res);
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
    await supplierService.deleteSupplier(req.params.id);
    new ApiResponse(null, 'Supplier deleted successfully').send(res);
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const result = await supplierService.listSuppliers({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
    });

    new ApiResponse(result.data, 'Suppliers retrieved successfully', 200).send(res);
});