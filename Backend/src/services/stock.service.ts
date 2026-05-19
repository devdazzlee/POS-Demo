import { Stock, StockMovement } from "@prisma/client";
import { prisma } from '../prisma/client';
import { AppError } from "../utils/apiError";
import { addDecimal, asNumber } from "../utils/helpers";

class StockService {
    async createStock({ productId, branchId, quantity, createdBy }: {
        productId: Stock["product_id"];
        branchId: Stock["branch_id"];
        quantity: Stock["current_quantity"];
        createdBy: StockMovement["created_by"];
    }) {
        return prisma.$transaction(async (tx) => {
            const exists = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });

            let stock;
            let previousQty = 0;
            let newQty = quantity;

            if (exists) {
                // If stock exists, add to existing quantity
                previousQty = asNumber(exists.current_quantity);
                newQty = addDecimal(exists.current_quantity, quantity);
                
                stock = await tx.stock.update({
                    where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
                    data: {
                        current_quantity: newQty,
                    },
                });
            } else {
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

    async adjustStock({ productId, branchId, quantityChange, reason, createdBy }: {
        productId: string;
        branchId: string;
        quantityChange: number;
        reason?: string;
        createdBy: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });

            if (!stock) throw new AppError(404, "Stock not found");

            const newQty = addDecimal(stock.current_quantity, quantityChange);
            if (newQty.lt(0)) throw new AppError(400, "Insufficient stock");

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

    async transferStock({ productId, fromBranchId, toBranchId, quantity, notes, createdBy }: {
        productId: string;
        fromBranchId: string;
        toBranchId: string;
        quantity: number;
        notes?: string;
        createdBy: string;
    }) {
        if (fromBranchId === toBranchId) {
            throw new AppError(400, "Cannot transfer to the same branch");
        }

        if (quantity <= 0) {
            throw new AppError(400, "Quantity must be greater than 0");
        }

        return prisma.$transaction(async (tx) => {
            // Get source stock
            const sourceStock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: fromBranchId } },
            });

            if (!sourceStock) {
                throw new AppError(404, "Source stock not found");
            }

            const sourceQty = asNumber(sourceStock.current_quantity);
            if (sourceQty < quantity) {
                throw new AppError(400, "Insufficient stock for transfer");
            }

            // Deduct from source branch
            const newSourceQty = addDecimal(sourceStock.current_quantity, -quantity);
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
            } else {
                // Add to destination branch
                const newDestQty = addDecimal(destinationStock.current_quantity, quantity);
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

    async removeStock({ productId, branchId, quantity, reason, createdBy }: {
        productId: string;
        branchId: string;
        quantity: number;
        reason?: string;
        createdBy: string;
    }) {
        if (quantity <= 0) {
            throw new AppError(400, "Quantity must be greater than 0");
        }

        return prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findUnique({
                where: { product_id_branch_id: { product_id: productId, branch_id: branchId } },
            });

            if (!stock) throw new AppError(404, "Stock not found");

            const currentQty = asNumber(stock.current_quantity);
            if (currentQty < quantity) {
                throw new AppError(400, "Insufficient stock to remove");
            }

            const newQty = addDecimal(stock.current_quantity, -quantity);
            
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

    async getStockByBranch(branchId: string, page: number = 1, limit: number = 20, search?: string, userRole?: string, categoryId?: string) {
        const skip = (page - 1) * limit;
        
        const where: any = {};
        
        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId.trim() !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            where.branch_id = branchId;
        } else if (branchId && branchId.trim() !== "") {
            // Admin can still filter by specific branch if they choose
             where.branch_id = branchId;
        }
        
        if (search && search.trim() !== "" || categoryId) {
            where.product = {};
            
            if (search && search.trim() !== "") {
                where.product.OR = [
                    { name: { contains: search, mode: 'insensitive' as any } },
                    { sku: { contains: search, mode: 'insensitive' as any } }
                ];
            }
            
            if (categoryId && categoryId !== 'all') {
                where.product.category_id = categoryId;
            }
        }
        
        const [stocks, total, stats, lowStockCount] = await Promise.all([
            prisma.stock.findMany({
                where,
                include: { product: true, branch: true },
                orderBy: { last_updated: "desc" },
                skip,
                take: limit,
            }),
            prisma.stock.count({ where }),
            prisma.stock.aggregate({
                where,
                _sum: {
                    current_quantity: true
                }
            }),
            prisma.stock.count({
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

    async getStockMovements(branchId: string, userRole?: string) {
        const where: any = {};
        
        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId.trim() !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            where.branch_id = branchId;
        }
        
        return prisma.stockMovement.findMany({
            where,
            include: { product: true, branch: true, user: { select: { email: true } } },
            orderBy: { created_at: "desc" },
        });
    }

    async getTodayStockMovements(branchId?: string, userRole?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const whereClause: any = {
            created_at: {
                gte: today,
                lt: tomorrow,
            }
        };

        // Only filter by branch if branchId is provided AND user is not admin
        if (branchId && branchId !== "" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            whereClause.branch_id = branchId;
        }

        return prisma.stockMovement.findMany({
            where: whereClause,
            include: { product: true, branch: true, user: { select: { email: true } } },
            orderBy: { created_at: "desc" },
        });
    }
}

export { StockService };
