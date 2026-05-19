"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutCustomer = exports.deleteCustomer = exports.updateCustomer = exports.updateCustomerByAdmin = exports.getCustomers = exports.getCustomerById = exports.loginCustomer = exports.createShopCustomer = exports.createCustomer = void 0;
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const customer_service_1 = __importDefault(require("../services/customer.service"));
const customerService = new customer_service_1.default();
exports.createCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    const customer = await customerService.createCustomer(req.body);
    new apiResponse_1.ApiResponse(customer, 'Customer successfully created', 200).send(res);
});
exports.createShopCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    const customer = await customerService.createShopCustomer(req.body);
    new apiResponse_1.ApiResponse(customer, 'Customer successfully created', 200).send(res);
});
exports.loginCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const customer = await customerService.loginCustomer(email, password);
    new apiResponse_1.ApiResponse(customer, 'Customer successfully created', 200).send(res);
});
exports.getCustomerById = (0, asyncHandler_1.default)(async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.customerId);
    new apiResponse_1.ApiResponse(customer, 'Customer fetched').send(res);
});
exports.getCustomers = (0, asyncHandler_1.default)(async (req, res) => {
    const customers = await customerService.getCustomers(req.query.search);
    new apiResponse_1.ApiResponse(customers, 'Customers fetched').send(res);
});
exports.updateCustomerByAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    const customers = await customerService.updateCustomer(req.params?.customerId, req.body);
    new apiResponse_1.ApiResponse(customers, 'Customers fetched').send(res);
});
exports.updateCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    const customers = await customerService.updateCustomer(req.customer?.id, req.body);
    new apiResponse_1.ApiResponse(customers, 'Customers fetched').send(res);
});
exports.deleteCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    await customerService.deleteCustomer(req.params.customerId);
    new apiResponse_1.ApiResponse(null, 'Customer deleted').send(res);
});
exports.logoutCustomer = (0, asyncHandler_1.default)(async (req, res) => {
    const customers = await customerService.logoutCustomer(req.customer?.id);
    new apiResponse_1.ApiResponse(customers, 'Customers logout').send(res);
});
//# sourceMappingURL=customer.controller.js.map