import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';
import { OrderStatus } from '@prisma/client';

const orderService = new OrderService();

const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder({...req.body, customerId: req.customer?.id!});
  new ApiResponse(order, 'Order created successfully', 201).send(res);
});

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', pageSize = '10' } = req.query;

  const orders = await orderService.getOrders(
    status ? (status as OrderStatus) : undefined,
    parseInt(page as string, 10),
    parseInt(pageSize as string, 10)
  );

  new ApiResponse(orders, 'Orders retrieved successfully').send(res);
});

const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = await orderService.getSpecificOrder(orderId);
  new ApiResponse(order, 'Order retrieved successfully').send(res);
});

const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.customer?.id!;
  const orders = await orderService.getCustomerOrders(customerId);
  new ApiResponse(orders, 'Your orders retrieved successfully').send(res);
});

const getMyOrderById = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.customer?.id!;
  const orderId = req.params.id;

  const order = await orderService.getCustomerOrderById(customerId, orderId);
  new ApiResponse(order, 'Your order retrieved successfully').send(res);
});

const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
  new ApiResponse(order, 'Order status updated successfully').send(res);
});

const cancelOrderByAdmin = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const result = await orderService.cancelOrderByAdmin(orderId);
  new ApiResponse(result, 'Order cancelled by admin').send(res);
});
const cancelOrderByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const customerId = req.customer?.id!;
  const result = await orderService.cancelOrderByCustomer(customerId, orderId);
  new ApiResponse(result, 'Your order has been cancelled').send(res);
});

const reopenOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await orderService.reopenOrder(orderId);
  new ApiResponse(order, 'Order re-opened successfully and stock re-allocated').send(res);
});

const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  await orderService.deleteOrder(orderId);
  new ApiResponse(null, 'Order permanently deleted').send(res);
});

export {
  createOrder,
  getOrders,
  getOrder,
  getMyOrders,
  getMyOrderById,
  updateOrderStatus,
  cancelOrderByAdmin,
  cancelOrderByCustomer,
  reopenOrder,
  deleteOrder
};
