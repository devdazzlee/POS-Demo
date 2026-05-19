import { prisma } from '../prisma/client';
import { Prisma } from '@prisma/client';

export class ReportsService {
  /**
   * Get all sales for reports (admin sees all, branch users see only their branch)
   */
  async getSalesForReports({ branchId, userRole }: { branchId?: string; userRole?: string }) {
    const where: Prisma.SaleWhereInput = {};
    
    // Only filter by branch if user is not admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && branchId) {
      where.branch_id = branchId;
    }

    return prisma.sale.findMany({
      where,
      include: {
        sale_items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: { sale_date: 'desc' },
    });
  }

  /**
   * Get best selling products
   */
  async getBestSellingProducts({ branchId, userRole, limit = 10 }: { branchId?: string; userRole?: string; limit?: number }) {
    const where: Prisma.SaleItemWhereInput = {};
    
    // Only filter by branch if user is not admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && branchId) {
      where.sale = {
        branch_id: branchId,
      };
    }

    const products = await prisma.saleItem.groupBy({
      by: ['product_id'],
      where,
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = products.map(p => p.product_id);
    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: true,
      },
    });

    // Combine data
    return products.map(item => {
      const product = productDetails.find(p => p.id === item.product_id);
      return {
        id: item.product_id,
        name: product?.name || 'Unknown',
        sku: product?.sku || '',
        quantity_sold: Number(item._sum.quantity || 0),
        order_count: item._count.id,
        price: Number(product?.sales_rate_inc_dis_and_tax || product?.sales_rate_exc_dis_and_tax || 0),
        category: product?.category?.name || 'Uncategorized',
      };
    });
  }

  /**
   * Get dashboard stats for reports
   */
  async getReportsStats({ branchId, userRole }: { branchId?: string; userRole?: string }) {
    const where: Prisma.SaleWhereInput = {};
    
    // Only filter by branch if user is not admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && branchId) {
      where.branch_id = branchId;
    }

    const [totalSales, totalRevenue, uniqueCustomers] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where,
        _sum: {
          total_amount: true,
        },
      }),
      prisma.sale.findMany({
        where,
        select: {
          customer_id: true,
        },
        distinct: ['customer_id'],
      }),
    ]);

    return {
      totalSales,
      totalRevenue: Number(totalRevenue._sum.total_amount || 0),
      uniqueCustomers: uniqueCustomers.filter(c => c.customer_id).length,
    };
  }
}

