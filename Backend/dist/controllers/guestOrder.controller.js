"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuestOrderById = exports.getGuestOrders = exports.createGuestOrder = void 0;
const guestOrder_service_1 = require("../services/guestOrder.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const guestOrderService = new guestOrder_service_1.GuestOrderService();
const createGuestOrder = (0, asyncHandler_1.default)(async (req, res) => {
    const order = await guestOrderService.createGuestOrder(req.body);
    new apiResponse_1.ApiResponse(order, 'Order placed successfully. Confirmation email sent.', 201).send(res);
});
exports.createGuestOrder = createGuestOrder;
const getGuestOrders = (0, asyncHandler_1.default)(async (req, res) => {
    const { status, page = '1', pageSize = '10' } = req.query;
    const orders = await guestOrderService.getGuestOrders(status, parseInt(page, 10), parseInt(pageSize, 10));
    new apiResponse_1.ApiResponse(orders, 'Website orders retrieved successfully').send(res);
});
exports.getGuestOrders = getGuestOrders;
const getGuestOrderById = (0, asyncHandler_1.default)(async (req, res) => {
    const orderId = req.params.id;
    const order = await guestOrderService.getGuestOrderById(orderId);
    new apiResponse_1.ApiResponse(order, 'Website order retrieved successfully').send(res);
});
exports.getGuestOrderById = getGuestOrderById;
//# sourceMappingURL=guestOrder.controller.js.map