"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const helpers_1 = require("../utils/helpers");
function generateTransferRef() {
    return `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
class TransferService {
    async createTransfer(data) {
        if (data.fromBranchId === data.toBranchId) {
            throw new apiError_1.AppError(400, 'Cannot transfer to the same location');
        }
        if (data.quantity <= 0) {
            throw new apiError_1.AppError(400, 'Quantity must be greater than 0');
        }
        return client_1.prisma.$transaction(async (tx) => {
            const sourceStock = await tx.stock.findUnique({
                where: {
                    product_id_branch_id: {
                        product_id: data.productId,
                        branch_id: data.fromBranchId,
                    },
                },
            });
            if (!sourceStock) {
                throw new apiError_1.AppError(404, 'Source stock not found');
            }
            const sourceQty = (0, helpers_1.asNumber)(sourceStock.current_quantity);
            if (sourceQty < data.quantity) {
                throw new apiError_1.AppError(400, 'Insufficient stock for transfer');
            }
            const referenceNo = generateTransferRef();
            const transfer = await tx.transfer.create({
                data: {
                    product_id: data.productId,
                    quantity: data.quantity,
                    from_branch_id: data.fromBranchId,
                    to_branch_id: data.toBranchId,
                    status: 'PENDING',
                    reference_no: referenceNo,
                    reason: data.reason || 'Stock Replenishment',
                    carrier_name: data.carrierName,
                    vehicle_no: data.vehicleNo,
                    estimated_arrival: data.estimatedArrival,
                    receiver_name: data.receiverName,
                    notes: data.notes,
                    created_by: data.createdBy,
                },
                include: {
                    product: true,
                    from_branch: true,
                    to_branch: true,
                    user: { select: { email: true } },
                },
            });
            const newSourceQty = (0, helpers_1.addDecimal)(sourceStock.current_quantity, -data.quantity);
            await tx.stock.update({
                where: {
                    product_id_branch_id: {
                        product_id: data.productId,
                        branch_id: data.fromBranchId,
                    },
                },
                data: { current_quantity: newSourceQty },
            });
            let destStock = await tx.stock.findUnique({
                where: {
                    product_id_branch_id: {
                        product_id: data.productId,
                        branch_id: data.toBranchId,
                    },
                },
            });
            let finalDestQty;
            if (!destStock) {
                destStock = await tx.stock.create({
                    data: {
                        product_id: data.productId,
                        branch_id: data.toBranchId,
                        current_quantity: data.quantity,
                    },
                });
                finalDestQty = data.quantity;
            }
            else {
                finalDestQty = (0, helpers_1.addDecimal)(destStock.current_quantity, data.quantity);
                await tx.stock.update({
                    where: {
                        product_id_branch_id: {
                            product_id: data.productId,
                            branch_id: data.toBranchId,
                        },
                    },
                    data: { current_quantity: finalDestQty },
                });
            }
            await tx.stockMovement.create({
                data: {
                    product_id: data.productId,
                    branch_id: data.fromBranchId,
                    movement_type: 'TRANSFER_OUT',
                    reference_id: transfer.id,
                    reference_type: 'transfer',
                    quantity_change: -data.quantity,
                    previous_qty: sourceStock.current_quantity,
                    new_qty: newSourceQty,
                    notes: `Transfer to ${data.toBranchId} - ${referenceNo}`,
                    created_by: data.createdBy,
                },
            });
            await tx.stockMovement.create({
                data: {
                    product_id: data.productId,
                    branch_id: data.toBranchId,
                    movement_type: 'TRANSFER_IN',
                    reference_id: transfer.id,
                    reference_type: 'transfer',
                    quantity_change: data.quantity,
                    previous_qty: destStock?.current_quantity || 0,
                    new_qty: finalDestQty,
                    notes: `Transfer from ${data.fromBranchId} - ${referenceNo}`,
                    created_by: data.createdBy,
                },
            });
            return transfer;
        });
    }
    async updateTransferStatus(id, status, userId) {
        const transfer = await client_1.prisma.transfer.findUnique({
            where: { id },
            include: { product: true, from_branch: true, to_branch: true },
        });
        if (!transfer)
            throw new apiError_1.AppError(404, 'Transfer not found');
        const updateData = { status };
        if (status === 'RECEIVED') {
            updateData.received_at = new Date();
            if (userId)
                updateData.received_by = userId;
        }
        return client_1.prisma.transfer.update({
            where: { id },
            data: updateData,
            include: {
                product: true,
                from_branch: true,
                to_branch: true,
                user: { select: { email: true } },
            },
        });
    }
    async listTransfers(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.fromBranchId)
            where.from_branch_id = params.fromBranchId;
        if (params.toBranchId)
            where.to_branch_id = params.toBranchId;
        if (params.productId)
            where.product_id = params.productId;
        if (params.status)
            where.status = params.status;
        if (params.branchId) {
            where.OR = [
                { from_branch_id: params.branchId },
                { to_branch_id: params.branchId },
            ];
        }
        if (params.startDate || params.endDate) {
            where.transfer_date = {};
            if (params.startDate)
                where.transfer_date.gte = params.startDate;
            if (params.endDate)
                where.transfer_date.lte = params.endDate;
        }
        const [total, transfers] = await Promise.all([
            client_1.prisma.transfer.count({ where }),
            client_1.prisma.transfer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { transfer_date: 'desc' },
                include: {
                    product: true,
                    from_branch: true,
                    to_branch: true,
                    user: { select: { email: true } },
                },
            }),
        ]);
        return {
            data: transfers,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getTransferById(id) {
        const transfer = await client_1.prisma.transfer.findUnique({
            where: { id },
            include: {
                product: true,
                from_branch: true,
                to_branch: true,
                user: { select: { email: true } },
            },
        });
        if (!transfer)
            throw new apiError_1.AppError(404, 'Transfer not found');
        return transfer;
    }
    async getPendingTransfers(branchId) {
        const where = {
            status: { in: ['PENDING', 'DISPATCHED'] },
        };
        if (branchId) {
            where.OR = [
                { from_branch_id: branchId },
                { to_branch_id: branchId },
            ];
        }
        return client_1.prisma.transfer.findMany({
            where,
            orderBy: { transfer_date: 'desc' },
            include: {
                product: true,
                from_branch: true,
                to_branch: true,
            },
        });
    }
}
exports.TransferService = TransferService;
//# sourceMappingURL=transfer.service.js.map