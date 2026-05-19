import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import CustomerService from "../services/customer.service";

const customerService = new CustomerService();

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.createCustomer(req.body);
    new ApiResponse(customer, 'Customer successfully created', 200).send(res);
});

export const createShopCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.createShopCustomer(req.body);
    new ApiResponse(customer, 'Customer successfully created', 200).send(res);
});

export const loginCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const customer = await customerService.loginCustomer(email, password);
    new ApiResponse(customer, 'Customer successfully created', 200).send(res);
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerById(req.params.customerId);
    new ApiResponse(customer, 'Customer fetched').send(res);
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const customers = await customerService.getCustomers(req.query.search as string | undefined);
    new ApiResponse(customers, 'Customers fetched').send(res);
});

export const updateCustomerByAdmin = asyncHandler(async (req: Request, res: Response) => {
    const customers = await customerService.updateCustomer(req.params?.customerId, req.body);
    new ApiResponse(customers, 'Customers fetched').send(res);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customers = await customerService.updateCustomer(req.customer?.id, req.body);
    new ApiResponse(customers, 'Customers fetched').send(res);
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    await customerService.deleteCustomer(req.params.customerId);
    new ApiResponse(null, 'Customer deleted').send(res);
});

export const logoutCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customers = await customerService.logoutCustomer(req.customer?.id);
    new ApiResponse(customers, 'Customers logout').send(res);
});