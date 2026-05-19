"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSuppliers = exports.deleteSupplier = exports.toggleSupplierStatus = exports.updateSupplier = exports.getSupplier = exports.createSupplier = void 0;
const supplier_service_1 = require("../services/supplier.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const supplierService = new supplier_service_1.SupplierService();
exports.createSupplier = (0, asyncHandler_1.default)(async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);
    new apiResponse_1.ApiResponse(supplier, 'Supplier created successfully', 201).send(res);
});
exports.getSupplier = (0, asyncHandler_1.default)(async (req, res) => {
    const supplier = await supplierService.getSupplierById(req.params.id);
    new apiResponse_1.ApiResponse(supplier, 'Supplier retrieved successfully').send(res);
});
exports.updateSupplier = (0, asyncHandler_1.default)(async (req, res) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    new apiResponse_1.ApiResponse(supplier, 'Supplier updated successfully').send(res);
});
exports.toggleSupplierStatus = (0, asyncHandler_1.default)(async (req, res) => {
    await supplierService.toggleSupplierStatus(req.params.id);
    new apiResponse_1.ApiResponse(null, 'Supplier status changed successfully').send(res);
});
exports.deleteSupplier = (0, asyncHandler_1.default)(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    new apiResponse_1.ApiResponse(null, 'Supplier deleted successfully').send(res);
});
exports.listSuppliers = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const result = await supplierService.listSuppliers({
        page: Number(page),
        limit: Number(limit),
        search: search,
    });
    new apiResponse_1.ApiResponse(result.data, 'Suppliers retrieved successfully', 200).send(res);
});
//# sourceMappingURL=supplier.controller.js.map