"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const client_1 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const date_fns_1 = require("date-fns");
class BranchService {
    async createBranch(data) {
        // Codes follow `BRANCH-NNN` / `WAREHOUSE-NNN`. The previous
        // `parseInt(lastBranch.code)` against e.g. `BRANCH-004` returned NaN, so
        // generate the next number from rows matching the same prefix.
        const prefix = data.branch_type === 'WAREHOUSE' ? 'WAREHOUSE' : 'BRANCH';
        const siblings = await client_1.prisma.branch.findMany({
            where: { code: { startsWith: `${prefix}-` } },
            select: { code: true },
        });
        const maxN = siblings.reduce((acc, b) => {
            const n = parseInt(b.code.split('-')[1] || '', 10);
            return Number.isFinite(n) && n > acc ? n : acc;
        }, 0);
        const code = `${prefix}-${String(maxN + 1).padStart(3, '0')}`;
        const branch = await client_1.prisma.branch.create({
            data: {
                ...data,
                code,
            },
        });
        return branch;
    }
    async deleteBranch(id) {
        // Surface a clear FK-block message rather than letting Prisma throw a raw
        // P2003. Disabling is always recommended over deletion for branches that
        // have ever participated in sales / stock movements.
        const branch = await client_1.prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        stock: true,
                        sales: true,
                        hold_sales: true,
                        purchase_orders: true,
                        stock_movements: true,
                        Order: true,
                        User: true,
                        employees: true,
                        purchases_from: true,
                        transfers_from: true,
                        transfers_to: true,
                        stock_adjustments: true,
                        cashflows: true,
                        category: true,
                    },
                },
            },
        });
        if (!branch)
            throw new apiError_1.AppError(404, 'Branch not found');
        const counts = branch._count;
        const parts = [];
        if (counts.stock > 0)
            parts.push(`${counts.stock} stock record${counts.stock === 1 ? '' : 's'}`);
        if (counts.sales > 0)
            parts.push(`${counts.sales} sale${counts.sales === 1 ? '' : 's'}`);
        if (counts.hold_sales > 0)
            parts.push(`${counts.hold_sales} held sale${counts.hold_sales === 1 ? '' : 's'}`);
        if (counts.purchase_orders > 0)
            parts.push(`${counts.purchase_orders} purchase order${counts.purchase_orders === 1 ? '' : 's'}`);
        if (counts.purchases_from > 0)
            parts.push(`${counts.purchases_from} purchase${counts.purchases_from === 1 ? '' : 's'}`);
        if (counts.stock_movements > 0)
            parts.push(`${counts.stock_movements} stock movement${counts.stock_movements === 1 ? '' : 's'}`);
        if (counts.stock_adjustments > 0)
            parts.push(`${counts.stock_adjustments} stock adjustment${counts.stock_adjustments === 1 ? '' : 's'}`);
        if (counts.transfers_from > 0 || counts.transfers_to > 0) {
            const t = counts.transfers_from + counts.transfers_to;
            parts.push(`${t} transfer${t === 1 ? '' : 's'}`);
        }
        if (counts.Order > 0)
            parts.push(`${counts.Order} order${counts.Order === 1 ? '' : 's'}`);
        if (counts.User > 0)
            parts.push(`${counts.User} user${counts.User === 1 ? '' : 's'}`);
        if (counts.employees > 0)
            parts.push(`${counts.employees} employee${counts.employees === 1 ? '' : 's'}`);
        if (counts.cashflows > 0)
            parts.push(`${counts.cashflows} cash drawer record${counts.cashflows === 1 ? '' : 's'}`);
        if (counts.category > 0)
            parts.push(`${counts.category} categor${counts.category === 1 ? 'y' : 'ies'}`);
        if (parts.length > 0) {
            throw new apiError_1.AppError(409, `Cannot delete branch — it is linked to ${parts.join(', ')}. Disable the branch instead.`);
        }
        await client_1.prisma.branch.delete({ where: { id } });
        return { message: 'Branch deleted successfully' };
    }
    async getBranchById(id) {
        const branch = await client_1.prisma.branch.findUnique({
            where: {
                id,
            },
        });
        if (!branch) {
            throw new apiError_1.AppError(404, 'Branch not found');
        }
        return branch;
    }
    async updateBranch(id, data) {
        const branch = await client_1.prisma.branch.findUnique({
            where: {
                id,
            },
        });
        if (!branch) {
            throw new apiError_1.AppError(404, 'Branch not found');
        }
        const updatedBranch = await client_1.prisma.branch.update({
            where: {
                id,
            },
            data,
        });
        return updatedBranch;
    }
    async toggleBranchStatus(id) {
        // Check if branch exists
        const branch = await client_1.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new apiError_1.AppError(404, 'Branch not found');
        }
        // Toggle the is_active status
        const updatedBranch = await client_1.prisma.branch.update({
            where: { id },
            data: { is_active: !branch.is_active },
        });
        console.log('Updated Branch:', updatedBranch, 'is_active:', updatedBranch.is_active, branch);
        return updatedBranch;
    }
    async listBranches({ page = 1, limit = 10, search, is_active, fetch_all, }) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        const take = fetch_all ? 1000 : limit;
        const skip = fetch_all ? 0 : (page - 1) * limit;
        const [total, branches] = await Promise.all([
            client_1.prisma.branch.count({ where }),
            client_1.prisma.branch.findMany({
                where,
                skip,
                take,
                orderBy: {
                    created_at: 'desc',
                },
            }),
        ]);
        return {
            data: branches,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getBranchDetails(branchId) {
        const today = new Date();
        const branch = await client_1.prisma.branch.findUnique({
            where: { id: branchId },
            include: {
                employees: {
                    where: { is_active: true },
                    include: {
                        employee_type: true,
                    },
                },
                sales: {
                    where: {
                        sale_date: {
                            gte: (0, date_fns_1.startOfDay)(today),
                            lte: (0, date_fns_1.endOfDay)(today),
                        },
                    },
                    select: {
                        id: true,
                        sale_number: true,
                        total_amount: true,
                        sale_date: true,
                        payment_method: true,
                        status: true,
                    },
                },
            },
        });
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }
}
exports.BranchService = BranchService;
//# sourceMappingURL=branch.service.js.map