import { prisma } from "../prisma/client";

export class StatsService {
    private async totalCustomers() {
        const total = await prisma.customer.count();
        return total;
    }

    private async lowStockProducts() {
        const lowStock = await prisma.stock.findMany({
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

    private async todaySales() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sales = await prisma.sale.findMany({
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

    public async getDashboardStats() {
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