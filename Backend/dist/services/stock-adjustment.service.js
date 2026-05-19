"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAdjustmentService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const helpers_1 = require("../utils/helpers");
class StockAdjustmentService {
    async createAdjustment(data) {
        let difference = 0;
        let newQty = data.systemQuantity;
        if (data.adjustmentType === 'RECONCILIATION') {
            if (data.physicalCount === undefined)
                throw new apiError_1.AppError(400, 'Physical count is required for reconciliation');
            const physicalCount = data.physicalCount;
            newQty = physicalCount;
            difference = physicalCount - data.systemQuantity;
        }
        else if (data.adjustmentType === 'ADDITION') {
            if (data.changeQuantity === undefined)
                throw new apiError_1.AppError(400, 'Change quantity is required for addition');
            const changeQuantity = data.changeQuantity;
            difference = changeQuantity;
            newQty = data.systemQuantity + difference;
        }
        else if (data.adjustmentType === 'SUBTRACTION') {
            if (data.changeQuantity === undefined)
                throw new apiError_1.AppError(400, 'Change quantity is required for subtraction');
            const changeQuantity = data.changeQuantity;
            difference = -Math.abs(changeQuantity);
            newQty = data.systemQuantity + difference;
        }
        if (difference === 0 && data.adjustmentType === 'RECONCILIATION') {
            throw new apiError_1.AppError(400, 'No difference between system and physical count');
        }
        return client_1.prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findUnique({
                where: {
                    product_id_branch_id: {
                        product_id: data.productId,
                        branch_id: data.branchId,
                    },
                },
            });
            const previousQty = stock ? (0, helpers_1.asNumber)(stock.current_quantity) : 0;
            if (stock) {
                await tx.stock.update({
                    where: {
                        product_id_branch_id: {
                            product_id: data.productId,
                            branch_id: data.branchId,
                        },
                    },
                    data: { current_quantity: newQty },
                });
            }
            else {
                if (newQty < 0) {
                    throw new apiError_1.AppError(400, 'Resulting stock cannot be negative');
                }
                await tx.stock.create({
                    data: {
                        product_id: data.productId,
                        branch_id: data.branchId,
                        current_quantity: newQty,
                    },
                });
            }
            await tx.stockMovement.create({
                data: {
                    product_id: data.productId,
                    branch_id: data.branchId,
                    movement_type: 'ADJUSTMENT',
                    reference_type: 'adjustment',
                    quantity_change: difference,
                    previous_qty: previousQty,
                    new_qty: newQty,
                    notes: data.reason || `${data.adjustmentType} - ${data.adjustmentCategory}. Ref: ${data.referenceNo || 'N/A'}`,
                    created_by: data.adjustedBy,
                },
            });
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    product_id: data.productId,
                    branch_id: data.branchId,
                    system_quantity: data.systemQuantity,
                    physical_count: data.physicalCount,
                    change_quantity: data.changeQuantity,
                    difference,
                    adjustment_type: data.adjustmentType,
                    adjustment_category: data.adjustmentCategory,
                    reason: data.reason,
                    reference_no: data.referenceNo,
                    adjusted_by: data.adjustedBy,
                },
                include: {
                    product: true,
                    branch: true,
                    user: { select: { email: true } },
                },
            });
            return adjustment;
        });
    }
    async listAdjustments(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.productId)
            where.product_id = params.productId;
        if (params.branchId)
            where.branch_id = params.branchId;
        if (params.startDate || params.endDate) {
            where.adjustment_date = {};
            if (params.startDate)
                where.adjustment_date.gte = params.startDate;
            if (params.endDate)
                where.adjustment_date.lte = params.endDate;
        }
        const [total, adjustments] = await Promise.all([
            client_1.prisma.stockAdjustment.count({ where }),
            client_1.prisma.stockAdjustment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { adjustment_date: 'desc' },
                include: {
                    product: true,
                    branch: true,
                    user: { select: { email: true } },
                },
            }),
        ]);
        return {
            data: adjustments,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
exports.StockAdjustmentService = StockAdjustmentService;
//# sourceMappingURL=stock-adjustment.service.js.map