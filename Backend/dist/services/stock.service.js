"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const helpers_1 = require("../utils/helpers");
class StockService {
    async createStock({ productId, branchId, quantity, createdBy }) {
        return client_1.prisma.$transaction(async (tx) => {
            const exists = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });
            let stock;
            let previousQty = 0;
            let newQty = quantity;
            if (exists) {
                // If stock exists, add to existing quantity
                previousQty = (0, helpers_1.asNumber)(exists.current_quantity);
                newQty = (0, helpers_1.addDecimal)(exists.current_quantity, quantity);
                stock = await tx.stock.update({
                    where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
                    data: {
                        current_quantity: newQty,
                    },
                });
            }
            else {
                // If stock doesn't exist, create new entry
                stock = await tx.stock.create({
                    data: {
                        product_id: productId,
                        branch_id: branchId,
                        current_quantity: quantity,
                    },
                });
            }
            await tx.stockMovement.create({
                data: {
                    product_id: productId,
                    branch_id: branchId,
                    movement_type: "PURCHASE",
                    quantity_change: quantity,
                    previous_qty: previousQty,
                    new_qty: newQty,
                    created_by: createdBy,
                },
            });
            return stock;
        });
    }
    async adjustStock({ productId, branchId, quantityChange, reason, createdBy }) {
        return client_1.prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });
            if (!stock)
                throw new apiError_1.AppError(404, "Stock not found");
            const newQty = (0, helpers_1.addDecimal)(stock.current_quantity, quantityChange);
            if (newQty.lt(0))
                throw new apiError_1.AppError(400, "Insufficient stock");
            await tx.stock.update({
                where: {
                    product_id_branch_id: {
                        product_id: productId,
                        branch_id: branchId,
                    },
                },
                data: {
                    current_quantity: newQty,
                },
            });
            await tx.stockMovement.create({
                data: {
                    product_id: productId,
                    branch_id: branchId,
                    movement_type: quantityChange > 0 ? "ADJUSTMENT" : "DAMAGE",
                    quantity_change: quantityChange,
                    previous_qty: stock.current_quantity,
                    new_qty: newQty,
                    notes: reason,
                    created_by: createdBy,
                },
            });
            return { newQty };
        });
    }
    async transferStock({ productId, fromBranchId, toBranchId, quantity, notes, createdBy }) {
        if (fromBranchId === toBranchId) {
            throw new apiError_1.AppError(400, "Cannot transfer to the same branch");
        }
        if (quantity <= 0) {
            throw new apiError_1.AppError(400, "Quantity must be greater than 0");
        }
        return client_1.prisma.$transaction(async (tx) => {
            // Get source stock
            const sourceStock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: fromBranchId } },
            });
            if (!sourceStock) {
                throw new apiError_1.AppError(404, "Source stock not found");
            }
            const sourceQty = (0, helpers_1.asNumber)(sourceStock.current_quantity);
            if (sourceQty < quantity) {
                throw new apiError_1.AppError(400, "Insufficient stock for transfer");
            }
            // Deduct from source branch
            const newSourceQty = (0, helpers_1.addDecimal)(sourceStock.current_quantity, -quantity);
            await tx.stock.update({
                where: { product_id_branch_id: { product_id: productId, branch_id: fromBranchId } },
                data: { current_quantity: newSourceQty },
            });
            // Check if destination stock exists
            let destinationStock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: toBranchId } },
            });
            let finalDestQty;
            if (!destinationStock) {
                // Create destination stock if it doesn't exist
                destinationStock = await tx.stock.create({
                    data: {
                        product_id: productId,
                        branch_id: toBranchId,
                        current_quantity: quantity,
                    },
                });
                finalDestQty = quantity;
            }
            else {
                // Add to destination branch
                const newDestQty = (0, helpers_1.addDecimal)(destinationStock.current_quantity, quantity);
                await tx.stock.update({
                    where: { product_id_branch_id: { product_id: productId, branch_id: toBranchId } },
                    data: { current_quantity: newDestQty },
                });
                finalDestQty = newDestQty;
            }
            // Create transfer out movement
            await tx.stockMovement.create({
                data: {
                    product_id: productId,
                    branch_id: fromBranchId,
                    movement_type: "TRANSFER_OUT",
                    quantity_change: -quantity,
                    previous_qty: sourceStock.current_quantity,
                    new_qty: newSourceQty,
                    notes: notes || `Transferred to ${toBranchId}`,
                    created_by: createdBy,
                },
            });
            // Create transfer in movement
            await tx.stockMovement.create({
                data: {
                    product_id: productId,
                    branch_id: toBranchId,
                    movement_type: "TRANSFER_IN",
                    quantity_change: quantity,
                    previous_qty: destinationStock.current_quantity || 0,
                    new_qty: finalDestQty,
                    notes: notes || `Transferred from ${fromBranchId}`,
                    created_by: createdBy,
                },
            });
            return {
                success: true,
                fromBranch: { newQty: newSourceQty },
                toBranch: { newQty: finalDestQty },
            };
        });
    }
    async removeStock({ productId, branchId, quantity, reason, createdBy }) {
        if (quantity <= 0) {
            throw new apiError_1.AppError(400, "Quantity must be greater than 0");
        }
        return client_1.prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });
            if (!stock)
                throw new apiError_1.AppError(404, "Stock not found");
            const currentQty = (0, helpers_1.asNumber)(stock.current_quantity);
            if (currentQty < quantity) {
                throw new apiError_1.AppError(400, "Insufficient stock to remove");
            }
            const newQty = (0, helpers_1.addDecimal)(stock.current_quantity, -quantity);
            await tx.stock.update({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
                data: {
                    current_quantity: newQty,
                },
            });
            await tx.stockMovement.create({
                data: {
                    product_id: productId,
                    branch_id: branchId,
                    movement_type: "DAMAGE",
                    quantity_change: -quantity,
                    previous_qty: stock.current_quantity,
                    new_qty: newQty,
                    notes: reason || "Stock removed",
                    created_by: createdBy,
                },
            });
            return { newQty };
        });
    }
    async getStockByBranch(branchId, page = 1, limit = 20, search, userRole, categoryId) {
        const skip = (page - 1) * limit;
        const where = {};
        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId.trim() !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            where.branch_id = branchId;
        }
        else if (branchId && branchId.trim() !== "") {
            // Admin can still filter by specific branch if they choose
            where.branch_id = branchId;
        }
        if (search && search.trim() !== "" || categoryId) {
            where.product = {};
            if (search && search.trim() !== "") {
                where.product.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (categoryId && categoryId !== 'all') {
                where.product.category_id = categoryId;
            }
        }
        const [stocks, total, stats, lowStockCount] = await Promise.all([
            client_1.prisma.stock.findMany({
                where,
                include: { product: true, branch: true },
                orderBy: { last_updated: "desc" },
                skip,
                take: limit,
            }),
            client_1.prisma.stock.count({ where }),
            client_1.prisma.stock.aggregate({
                where,
                _sum: {
                    current_quantity: true
                }
            }),
            client_1.prisma.stock.count({
                where: {
                    ...where,
                    current_quantity: { lte: 10 }
                }
            })
        ]);
        return {
            data: stocks,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalQuantity: Number(stats._sum.current_quantity || 0),
                lowStockCount
            },
        };
    }
    async getStockMovements(branchId, userRole) {
        const where = {};
        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId.trim() !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            where.branch_id = branchId;
        }
        return client_1.prisma.stockMovement.findMany({
            where,
            include: { product: true, branch: true, user: { select: { email: true } } },
            orderBy: { created_at: "desc" },
        });
    }
    async getTodayStockMovements(branchId, userRole) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const whereClause = {
            created_at: {
                gte: today,
                lt: tomorrow,
            }
        };
        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            whereClause.branch_id = branchId;
        }
        return client_1.prisma.stockMovement.findMany({
            where: whereClause,
            include: { product: true, branch: true, user: { select: { email: true } } },
            orderBy: { created_at: "desc" },
        });
    }
}
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map