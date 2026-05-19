"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const helpers_1 = require("../utils/helpers");
class PurchaseService {
    async createPurchase(data) {
        const warehouse = await client_1.prisma.branch.findFirst({
            where: { id: data.warehouseBranchId, branch_type: 'WAREHOUSE' },
        });
        if (!warehouse) {
            const anyBranch = await client_1.prisma.branch.findUnique({
                where: { id: data.warehouseBranchId },
            });
            if (!anyBranch)
                throw new apiError_1.AppError(404, 'Warehouse branch not found');
        }
        return client_1.prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.create({
                data: {
                    product_id: data.productId,
                    supplier_id: data.supplierId,
                    warehouse_branch_id: data.warehouseBranchId,
                    quantity: data.quantity,
                    cost_price: data.costPrice,
                    sale_price: data.salePrice,
                    purchase_date: data.purchaseDate || new Date(),
                    invoice_ref: data.invoiceRef,
                    notes: data.notes,
                    delivery_status: data.deliveryStatus || 'COMPLETE',
                    created_by: data.createdBy,
                },
                include: {
                    product: true,
                    supplier: true,
                    warehouse_branch: true,
                    user: { select: { email: true } },
                },
            });
            let stock = await tx.stock.findUnique({
                where: {
                    product_id_branch_id: {
                        product_id: data.productId,
                        branch_id: data.warehouseBranchId,
                    },
                },
            });
            const qty = data.quantity;
            const previousQty = stock ? (0, helpers_1.asNumber)(stock.current_quantity) : 0;
            const newQty = stock ? (0, helpers_1.addDecimal)(stock.current_quantity, qty) : qty;
            if (stock) {
                await tx.stock.update({
                    where: {
                        product_id_branch_id: {
                            product_id: data.productId,
                            branch_id: data.warehouseBranchId,
                        },
                    },
                    data: { current_quantity: newQty },
                });
            }
            else {
                await tx.stock.create({
                    data: {
                        product_id: data.productId,
                        branch_id: data.warehouseBranchId,
                        current_quantity: qty,
                    },
                });
            }
            await tx.stockMovement.create({
                data: {
                    product_id: data.productId,
                    branch_id: data.warehouseBranchId,
                    movement_type: 'PURCHASE',
                    reference_id: purchase.id,
                    reference_type: 'purchase',
                    quantity_change: qty,
                    previous_qty: previousQty,
                    new_qty: typeof newQty === 'number' ? newQty : (0, helpers_1.asNumber)(newQty),
                    unit_cost: data.costPrice,
                    notes: data.notes,
                    created_by: data.createdBy,
                },
            });
            return purchase;
        });
    }
    // Multi-line GRN — saves the supplier delivery as N Purchase rows + one
    // stock movement per line, all in a single transaction. Use this for the
    // "Save purchase" flow on the Stock In screen.
    async createBulkPurchase(data) {
        if (!Array.isArray(data.lines) || data.lines.length === 0) {
            throw new apiError_1.AppError(400, 'At least one line is required');
        }
        const branch = await client_1.prisma.branch.findUnique({
            where: { id: data.warehouseBranchId },
        });
        if (!branch)
            throw new apiError_1.AppError(404, 'Warehouse branch not found');
        return client_1.prisma.$transaction(async (tx) => {
            const purchaseIds = [];
            for (const line of data.lines) {
                if (!line.productId)
                    throw new apiError_1.AppError(400, 'Product is required on every line');
                if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
                    throw new apiError_1.AppError(400, `Invalid quantity on line for product ${line.productId}`);
                }
                if (!Number.isFinite(line.costPrice) || line.costPrice < 0) {
                    throw new apiError_1.AppError(400, `Invalid cost price on line for product ${line.productId}`);
                }
                // Compose per-line notes that preserve the batch/expiry/notes
                // metadata next to the row's other fields.
                const noteParts = [];
                if (data.batchNo)
                    noteParts.push(`Batch: ${data.batchNo}`);
                if (data.expiryDate)
                    noteParts.push(`Expiry: ${data.expiryDate.toISOString().slice(0, 10)}`);
                if (data.notes)
                    noteParts.push(data.notes);
                const noteText = noteParts.length > 0 ? noteParts.join(' | ') : undefined;
                const purchase = await tx.purchase.create({
                    data: {
                        product_id: line.productId,
                        supplier_id: data.supplierId,
                        warehouse_branch_id: data.warehouseBranchId,
                        quantity: line.quantity,
                        cost_price: line.costPrice,
                        sale_price: line.salePrice ?? line.costPrice,
                        purchase_date: data.purchaseDate || new Date(),
                        invoice_ref: data.invoiceRef,
                        notes: noteText,
                        delivery_status: data.deliveryStatus || 'COMPLETE',
                        created_by: data.createdBy,
                    },
                });
                let stock = await tx.stock.findUnique({
                    where: {
                        product_id_branch_id: {
                            product_id: line.productId,
                            branch_id: data.warehouseBranchId,
                        },
                    },
                });
                const previousQty = stock ? (0, helpers_1.asNumber)(stock.current_quantity) : 0;
                const newQty = stock
                    ? (0, helpers_1.addDecimal)(stock.current_quantity, line.quantity)
                    : line.quantity;
                if (stock) {
                    await tx.stock.update({
                        where: {
                            product_id_branch_id: {
                                product_id: line.productId,
                                branch_id: data.warehouseBranchId,
                            },
                        },
                        data: { current_quantity: newQty },
                    });
                }
                else {
                    await tx.stock.create({
                        data: {
                            product_id: line.productId,
                            branch_id: data.warehouseBranchId,
                            current_quantity: line.quantity,
                        },
                    });
                }
                await tx.stockMovement.create({
                    data: {
                        product_id: line.productId,
                        branch_id: data.warehouseBranchId,
                        movement_type: 'PURCHASE',
                        reference_id: purchase.id,
                        reference_type: 'purchase',
                        quantity_change: line.quantity,
                        previous_qty: previousQty,
                        new_qty: typeof newQty === 'number' ? newQty : (0, helpers_1.asNumber)(newQty),
                        unit_cost: line.costPrice,
                        notes: noteText,
                        created_by: data.createdBy,
                    },
                });
                purchaseIds.push(purchase.id);
            }
            return { count: purchaseIds.length, purchaseIds };
        });
    }
    async listPurchases(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.productId)
            where.product_id = params.productId;
        if (params.supplierId)
            where.supplier_id = params.supplierId;
        if (params.branchId)
            where.warehouse_branch_id = params.branchId;
        if (params.userId)
            where.created_by = params.userId;
        if (params.startDate || params.endDate) {
            where.purchase_date = {};
            if (params.startDate)
                where.purchase_date.gte = params.startDate;
            if (params.endDate)
                where.purchase_date.lte = params.endDate;
        }
        const [total, purchases] = await Promise.all([
            client_1.prisma.purchase.count({ where }),
            client_1.prisma.purchase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { purchase_date: 'desc' },
                include: {
                    product: true,
                    supplier: true,
                    warehouse_branch: true,
                    user: { select: { email: true } },
                },
            }),
        ]);
        return {
            data: purchases,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getPurchaseById(id) {
        const purchase = await client_1.prisma.purchase.findUnique({
            where: { id },
            include: {
                product: true,
                supplier: true,
                warehouse_branch: true,
                user: { select: { email: true } },
            },
        });
        if (!purchase)
            throw new apiError_1.AppError(404, 'Purchase not found');
        return purchase;
    }
    async getMonthlyStats(warehouseBranchId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const where = {
            purchase_date: { gte: startOfMonth },
        };
        if (warehouseBranchId)
            where.warehouse_branch_id = warehouseBranchId;
        const purchases = await client_1.prisma.purchase.findMany({
            where,
            include: { product: true },
        });
        const totalQuantity = purchases.reduce((sum, p) => sum + (0, helpers_1.asNumber)(p.quantity), 0);
        const totalValue = purchases.reduce((sum, p) => sum + (0, helpers_1.asNumber)(p.quantity) * (0, helpers_1.asNumber)(p.cost_price), 0);
        return {
            totalPurchases: purchases.length,
            totalQuantity,
            totalValue,
        };
    }
}
exports.PurchaseService = PurchaseService;
//# sourceMappingURL=purchase.service.js.map