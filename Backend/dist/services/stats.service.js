"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const client_1 = require("../prisma/client");
class StatsService {
    async totalCustomers() {
        const total = await client_1.prisma.customer.count();
        return total;
    }
    async lowStockProducts() {
        const lowStock = await client_1.prisma.stock.findMany({
            where: {
                current_quantity: {
                    lt: 10,
                },
                product: {
                    is_active: true,
                },
            },
            select: {
                id: true,
                current_quantity: true,
                product_id: true,
                product: {
                    select: {
                        name: true,
                        sku: true,
                        is_active: true,
                    },
                },
            },
        });
        return lowStock;
    }
    async todaySales() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sales = await client_1.prisma.sale.findMany({
            where: {
                created_at: {
                    gte: today,
                },
            },
            select: {
                id: true,
                total_amount: true,
                sale_number: true,
                status: true,
                created_at: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });
        return sales;
    }
    async getDashboardStats() {
        const [totalCustomers, lowStockProducts, todaySales] = await Promise.all([
            this.totalCustomers(),
            this.lowStockProducts(),
            this.todaySales(),
        ]);
        return {
            totalCustomers,
            lowStockProducts,
            todaySales,
        };
    }
}
exports.StatsService = StatsService;
//# sourceMappingURL=stats.service.js.map