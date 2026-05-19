"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHoldSaleController = exports.retrieveHoldSaleController = exports.createHoldSaleController = exports.getHoldSalesController = exports.getRecentSaleItemProductNameAndPrice = exports.getTodaySalesController = exports.refundSaleController = exports.createSaleController = exports.getSaleByIdController = exports.getSalesForReturnsController = exports.getSalesController = void 0;
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const sales_service_1 = require("../services/sales.service");
const apiResponse_1 = require("../utils/apiResponse");
const saleService = new sales_service_1.SaleService();
const resolveBranchId = (req) => {
    const jwtBranchId = req.user?.branch_id;
    const userRole = req.user?.role;
    // Admins can override branch ID
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
        const queryBranchId = req.query.branchId;
        const bodyBranchId = req.body?.branchId;
        if (queryBranchId && queryBranchId.trim() && queryBranchId !== "Not Found") {
            return queryBranchId.trim();
        }
        if (bodyBranchId && bodyBranchId.trim() && bodyBranchId !== "Not Found") {
            return bodyBranchId.trim();
        }
    }
    // Force non-admins to use their JWT branch ID
    if (jwtBranchId && jwtBranchId.trim() && jwtBranchId !== "Not Found") {
        return jwtBranchId.trim();
    }
    return undefined;
};
const getSalesController = (0, asyncHandler_1.default)(async (req, res) => {
    // Priority: query parameter (branchId from localStorage) > JWT token branch_id
    // If branchId is provided in query, use it to filter (even for admins)
    // If no branchId in query and user is admin, return all sales
    // If no branchId in query and user is not admin, use JWT token branch_id
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const queryBranchId = req.query.branchId;
    const jwtBranchId = req.user?.branch_id;
    let branchId;
    // If branchId is provided in query parameter (from localStorage), use it to filter
    if (queryBranchId && queryBranchId.trim() && queryBranchId.trim() !== "Not Found") {
        branchId = queryBranchId.trim();
        console.log("Filtering by branchId from query parameter (localStorage):", branchId);
    }
    else if (!isAdmin) {
        // Non-admin users: use JWT token branch_id if no query param
        branchId = jwtBranchId?.trim();
        console.log("Non-admin user - filtering by JWT branch_id:", branchId);
        // If still no branchId, return empty array
        if (!branchId || branchId === "Not Found") {
            console.warn("No valid branchId found for non-admin user");
            return new apiResponse_1.ApiResponse([], "No branch ID found for user").send(res);
        }
    }
    else {
        // Admin user with no branchId in query - return all sales
        branchId = undefined;
        console.log("Admin user - no branchId in query, returning all sales");
    }
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const search = req.query.search?.trim();
    const startDateRaw = req.query.startDate;
    const endDateRaw = req.query.endDate;
    const parsedStartDate = startDateRaw && !Number.isNaN(new Date(startDateRaw).getTime())
        ? new Date(startDateRaw)
        : undefined;
    const parsedEndDate = endDateRaw && !Number.isNaN(new Date(endDateRaw).getTime())
        ? new Date(endDateRaw)
        : undefined;
    const result = await saleService.getSales({
        branchId,
        page: Number.isFinite(page) && page > 0 ? page : undefined,
        limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
        search,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
    });
    console.log(`Returning ${result.data.length} sales for branchId: ${branchId || 'ALL'} (page: ${result.meta?.page}, total: ${result.meta?.total})`);
    new apiResponse_1.ApiResponse(result.data, "Sales fetched successfully", 200, true, result.meta).send(res);
});
exports.getSalesController = getSalesController;
const getSalesForReturnsController = (0, asyncHandler_1.default)(async (req, res) => {
    const search = req.query.search?.replace(/\s+/g, ' ').trim();
    const sales = await saleService.getSalesForReturns({
        branchId: req.user?.branch_id,
        search
    });
    new apiResponse_1.ApiResponse(sales, "Sales eligible for returns fetched successfully").send(res);
});
exports.getSalesForReturnsController = getSalesForReturnsController;
const getSaleByIdController = (0, asyncHandler_1.default)(async (req, res) => {
    const sale = await saleService.getSaleById(req.params.saleId);
    new apiResponse_1.ApiResponse(sale, "Sale details fetched").send(res);
});
exports.getSaleByIdController = getSaleByIdController;
const createSaleController = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    if (!branchId) {
        return new apiResponse_1.ApiResponse(null, "No branch ID found for sale", 400, false).send(res);
    }
    const sale = await saleService.createSale({
        ...req.body,
        branchId,
        createdBy: req.user.id
    });
    new apiResponse_1.ApiResponse(sale, "Sale created successfully", 201).send(res);
});
exports.createSaleController = createSaleController;
const refundSaleController = (0, asyncHandler_1.default)(async (req, res) => {
    const { customerId, returnedItems = [], exchangedItems = [], notes, branchId: bodyBranchId } = req.body;
    const originalSaleId = req.params.saleId;
    const createdBy = req.user.id;
    // Admin/super-admin users have no `branch_id` on their JWT, so we let
    // them either pass `branchId` in the body or fall back to the original
    // sale's branch (resolved inside the service).
    const branchId = (typeof bodyBranchId === 'string' && bodyBranchId) ||
        req.user?.branch_id ||
        undefined;
    const sale = await saleService.createExchangeOrReturnSale({
        originalSaleId,
        branchId,
        customerId,
        returnedItems,
        exchangedItems,
        notes,
        createdBy,
    });
    new apiResponse_1.ApiResponse(sale, "Sale refunded/exchanged successfully").send(res);
});
exports.refundSaleController = refundSaleController;
const getTodaySalesController = (0, asyncHandler_1.default)(async (req, res) => {
    const sales = await saleService.getTodaySales({ branchId: req.user?.branch_id });
    new apiResponse_1.ApiResponse(sales, "Today's sales fetched successfully").send(res);
});
exports.getTodaySalesController = getTodaySalesController;
const getRecentSaleItemProductNameAndPrice = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    const recentSaleItem = await saleService.getRecentSaleItemsProductNameAndPrice(branchId);
    new apiResponse_1.ApiResponse(recentSaleItem, "Recent sale item product name and price fetched successfully").send(res);
});
exports.getRecentSaleItemProductNameAndPrice = getRecentSaleItemProductNameAndPrice;
const getHoldSalesController = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    if (!branchId) {
        return new apiResponse_1.ApiResponse([], "No branch ID found for hold sales").send(res);
    }
    const holdSales = await saleService.getHoldSales({ branchId });
    new apiResponse_1.ApiResponse(holdSales, "Held sales fetched successfully").send(res);
});
exports.getHoldSalesController = getHoldSalesController;
const createHoldSaleController = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    if (!branchId) {
        return new apiResponse_1.ApiResponse(null, "No branch ID found for hold sale", 400, false).send(res);
    }
    const holdSale = await saleService.createHoldSale({
        branchId,
        customerId: req.body?.customerId,
        createdBy: req.user?.id,
        items: req.body?.items || [],
    });
    new apiResponse_1.ApiResponse(holdSale, "Sale held successfully", 201).send(res);
});
exports.createHoldSaleController = createHoldSaleController;
const retrieveHoldSaleController = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    if (!branchId) {
        return new apiResponse_1.ApiResponse(null, "No branch ID found for hold sale retrieval", 400, false).send(res);
    }
    const holdSale = await saleService.retrieveHoldSale({
        holdSaleId: req.params.holdSaleId,
        branchId,
    });
    new apiResponse_1.ApiResponse(holdSale, "Held sale retrieved successfully").send(res);
});
exports.retrieveHoldSaleController = retrieveHoldSaleController;
const deleteHoldSaleController = (0, asyncHandler_1.default)(async (req, res) => {
    const branchId = resolveBranchId(req);
    if (!branchId) {
        return new apiResponse_1.ApiResponse(null, "No branch ID found for hold sale deletion", 400, false).send(res);
    }
    await saleService.deleteHoldSale({
        holdSaleId: req.params.holdSaleId,
        branchId,
    });
    new apiResponse_1.ApiResponse(null, "Held sale deleted successfully").send(res);
});
exports.deleteHoldSaleController = deleteHoldSaleController;
//# sourceMappingURL=sale.controller.js.map