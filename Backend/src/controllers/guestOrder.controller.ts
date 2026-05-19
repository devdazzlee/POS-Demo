import { Request, Response } from 'express';
import { GuestOrderService } from '../services/guestOrder.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';

const guestOrderService = new GuestOrderService();

const createGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await guestOrderService.createGuestOrder(req.body);
  new ApiResponse(order, 'Order placed successfully. Confirmation email sent.', 201).send(res);
});

const getGuestOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', pageSize = '10' } = req.query;
  const orders = await guestOrderService.getGuestOrders(
    status as string | undefined,
    parseInt(page as string, 10),
    parseInt(pageSize as string, 10)
  );
  new ApiResponse(orders, 'Website orders retrieved successfully').send(res);
});

const getGuestOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = await guestOrderService.getGuestOrderById(orderId);
  new ApiResponse(order, 'Website order retrieved successfully').send(res);
});

export { createGuestOrder, getGuestOrders, getGuestOrderById };

