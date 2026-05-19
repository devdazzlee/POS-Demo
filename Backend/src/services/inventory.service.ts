import { prisma } from '../prisma/client';
import { asNumber } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export class InventoryService {
  async getDashboardStats(userRole?: string, branchId?: string) {
    const warehouse = await prisma.branch.findFirst({
      where: { branch_type: 'WAREHOUSE', is_active: true },
    });

    const branchFilter =
      userRole &&
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      branchId
        ? branchId
        : undefined;

    const stockWhere: Prisma.StockWhereInput = {};
    if (branchFilter) {
      stockWhere.branch_id = branchFilter;
    }

    const stocks = await prisma.stock.findMany({
      where: stockWhere,
      include: {
        product: true,
        branch: true,
      },
    });

    let totalInventoryValue = 0;
    const branchSummary: Record<
      string,
      { name: string; value: number; items: number; type: string }
    > = {};

    for (const s of stocks) {
      const qty = asNumber(s.current_quantity);
      const cost = asNumber((s.product as any).purchase_rate || 0);
      const value = qty * cost;
      const bid = s.branch_id;
      
      if (!branchSummary[bid]) {
        branchSummary[bid] = {
          name: (s.branch as any).name,
          value: 0,
          items: 0,
          type: (s.branch as any).branch_type
        };
      }
      
      branchSummary[bid].value += value;
      branchSummary[bid].items += 1;
      totalInventoryValue += value;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const purchaseWhere: Prisma.PurchaseWhereInput = {
      purchase_date: { gte: startOfMonth },
    };
    if (branchFilter) purchaseWhere.warehouse_branch_id = branchFilter;

    const recentPurchases = await prisma.purchase.findMany({
      where: purchaseWhere,
      take: 5,
      orderBy: { purchase_date: 'desc' },
      include: { product: true, supplier: true },
    });

    const pendingTransfersWhere: Prisma.TransferWhereInput = {
      status: { in: ['PENDING', 'DISPATCHED'] },
    };
    if (branchFilter) {
      pendingTransfersWhere.OR = [
        { from_branch_id: branchFilter },
        { to_branch_id: branchFilter },
      ];
    }

    const pendingTransfers = await prisma.transfer.findMany({
      where: pendingTransfersWhere,
      take: 10,
      orderBy: { transfer_date: 'desc' },
      include: { product: true, from_branch: true, to_branch: true },
    });

    const lowStockItems = stocks.filter((s) => {
      const minQty = asNumber(
        (s.product as any).min_qty ?? s.minimum_quantity ?? 0
      );
      return asNumber(s.current_quantity) <= minQty && minQty > 0;
    });

    const lowStockAlerts = lowStockItems.map((s) => ({
      product: s.product,
      branch: s.branch,
      currentQuantity: asNumber(s.current_quantity),
      minThreshold: asNumber(
        (s.product as any).min_qty ?? s.minimum_quantity ?? 0
      ),
    }));

    const outOfStockItems = stocks.filter((s) => asNumber(s.current_quantity) <= 0);

    const sortedTopValued = Object.entries(branchSummary)
      .map(([id, v]) => ({ branchId: id, ...v }))
      .sort((a, b) => b.value - a.value);

    // Get a simple trend for last 7 days (movements count)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const movementTrend = await prisma.stockMovement.groupBy({
      by: ['movement_type'],
      where: {
        created_at: { gte: sevenDaysAgo },
        ...(branchFilter ? { branch_id: branchFilter } : {})
      },
      _count: true
    });

    const categorySummary: Record<string, { value: number; items: number }> = {};
    for (const s of stocks) {
      const catName = (s.product as any).category?.name || "Uncategorized";
      const cost = asNumber((s.product as any).purchase_rate || 0);
      const val = asNumber(s.current_quantity) * cost;
      if (!categorySummary[catName]) categorySummary[catName] = { value: 0, items: 0 };
      categorySummary[catName].value += val;
      categorySummary[catName].items += 1;
    }

    // Top Selling (Velocity) - Last 7 Days
    const topMoving = await prisma.stockMovement.groupBy({
      by: ['product_id'],
      where: {
        movement_type: 'SALE',
        created_at: { gte: sevenDaysAgo },
        ...(branchFilter ? { branch_id: branchFilter } : {})
      },
      _sum: { quantity_change: true },
      orderBy: { _sum: { quantity_change: 'desc' } },
      take: 5
    });

    // Resolve product names for top moving
    const topMovingWithNames = await Promise.all(topMoving.map(async (m) => {
      const p = await prisma.product.findUnique({ where: { id: m.product_id }, select: { name: true } });
      return { 
        name: p?.name || 'Unknown', 
        quantity: Math.abs(asNumber(m._sum?.quantity_change || 0)) 
      };
    }));

    // Procurement Stats (Manual sum as Prisma aggregate doesn't support product of fields)
    const purchasesThisMonth = await prisma.purchase.findMany({
      where: {
        created_at: { gte: startOfMonth },
        ...(branchFilter ? { warehouse_branch_id: branchFilter } : {})
      },
      select: { quantity: true, cost_price: true }
    });

    const poTotalValue = purchasesThisMonth.reduce(
      (acc, p) => acc + asNumber(p.quantity) * asNumber(p.cost_price), 
      0
    );

    return {
      totalInventoryValue,
      totalSkus: await prisma.product.count({ where: { is_active: true } }),
      outOfStockCount: outOfStockItems.length,
      branchSummary: sortedTopValued,
      categorySummary: Object.entries(categorySummary).map(([name, v]) => ({ name, ...v })),
      velocity: topMovingWithNames,
      recentPurchases,
      pendingTransfers,
      lowStockAlerts,
      movementTrend,
      procurementHealth: {
        count: purchasesThisMonth.length,
        totalValue: poTotalValue
      },
      warehouse,
    };
  }

  async getLowStockProducts(branchId?: string) {
    const where: Prisma.StockWhereInput = {};
    if (branchId) where.branch_id = branchId;

    const stocks = await prisma.stock.findMany({
      where,
      include: { product: true, branch: true },
    });

    const lowStock = stocks.filter((s) => {
      const minQty = asNumber(
        (s.product as any).min_qty ?? s.minimum_quantity ?? 0
      );
      return minQty > 0 && asNumber(s.current_quantity) <= minQty;
    });

    return lowStock;
  }

  async getStockMovements(params: {
    branchId?: string;
    productId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    userRole?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};

    if (
      params.branchId &&
      params.userRole &&
      ['ADMIN', 'SUPER_ADMIN'].includes(params.userRole)
    ) {
      where.branch_id = params.branchId;
    } else if (
      params.branchId &&
      params.userRole &&
      !['ADMIN', 'SUPER_ADMIN'].includes(params.userRole)
    ) {
      where.branch_id = params.branchId;
    }

    if (params.productId) where.product_id = params.productId;
    if (params.movementType) where.movement_type = params.movementType as any;
    if (params.startDate || params.endDate) {
      where.created_at = {};
      if (params.startDate) where.created_at.gte = params.startDate;
      if (params.endDate) where.created_at.lte = params.endDate;
    }

    // Summary must reflect ALL movements matching the filter, not just the
    // current page. Previously we summed `movements` (the paginated slice)
    // which produced "+0 / -0" whenever the meaningful inbound/outbound
    // records lived on a later page.
    const [total, movements, increaseAgg, decreaseAgg] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          product: true,
          branch: true,
          user: { select: { email: true } },
        },
      }),
      prisma.stockMovement.aggregate({
        _sum: { quantity_change: true },
        where: { ...where, quantity_change: { gt: 0 } },
      }),
      prisma.stockMovement.aggregate({
        _sum: { quantity_change: true },
        where: { ...where, quantity_change: { lt: 0 } },
      }),
    ]);

    const summary = {
      totalIncrease: asNumber(increaseAgg._sum.quantity_change),
      totalDecrease: Math.abs(asNumber(decreaseAgg._sum.quantity_change)),
      count: total,
    };

    return {
      data: movements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary,
    };
  }

  async getStockByLocation(branchId?: string, userRole?: string) {
    const where: Prisma.StockWhereInput = {};
    if (
      branchId &&
      userRole &&
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      where.branch_id = branchId;
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: { product: true, branch: true },
      orderBy: [{ branch_id: 'asc' }, { product_id: 'asc' }],
    });

    return stocks;
  }

  async getReports(params: {
    type: 'valuation' | 'purchase' | 'transfer' | 'stockout' | 'lowstock' | 'aging' | 'movement_summary' | 'financial_audit';
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
    supplierId?: string;
    productId?: string;
    categoryId?: string;
  }) {
    switch (params.type) {
      case 'valuation': {
        const where: Prisma.StockWhereInput = {};
        if (params.branchId) where.branch_id = params.branchId;
        const stocks = await prisma.stock.findMany({
          where,
          include: { product: true, branch: true },
        });
        const byLocation: Record<string, { value: number; items: any[] }> = {};
        let totalValue = 0;
        let totalItems = 0;

        for (const s of stocks) {
          const bid = s.branch_id;
          if (!byLocation[bid]) {
            byLocation[bid] = { value: 0, items: [] };
          }
          const cost = asNumber((s.product as any).purchase_rate || 0);
          const value = asNumber(s.current_quantity) * cost;
          byLocation[bid].value += value;
          totalValue += value;
          totalItems += 1;
          byLocation[bid].items.push({
            product: s.product,
            quantity: asNumber(s.current_quantity),
            value,
          });
        }
        return { 
          byLocation, 
          totalValue, 
          summary: { totalValue, totalItems, locationsCount: Object.keys(byLocation).length } 
        };
      }

      case 'purchase': {
        const where: Prisma.PurchaseWhereInput = {};
        if (params.branchId) where.warehouse_branch_id = params.branchId;
        if (params.supplierId) where.supplier_id = params.supplierId;
        if (params.productId) where.product_id = params.productId;
        if (params.startDate || params.endDate) {
          where.purchase_date = {};
          if (params.startDate) where.purchase_date.gte = params.startDate;
          if (params.endDate) where.purchase_date.lte = params.endDate;
        }
        const purchases = await prisma.purchase.findMany({
          where,
          include: { product: true, supplier: true, warehouse_branch: true },
          orderBy: { purchase_date: 'desc' },
        });
        
        const totalCost = purchases.reduce((acc, p) => acc + asNumber(p.quantity) * asNumber(p.cost_price), 0);
        return {
          data: purchases,
          summary: { count: purchases.length, totalCost, avgPrice: purchases.length ? totalCost / purchases.length : 0 }
        };
      }

      case 'transfer': {
        const where: Prisma.TransferWhereInput = {};
        if (params.branchId) {
          where.OR = [
            { from_branch_id: params.branchId },
            { to_branch_id: params.branchId },
          ];
        }
        if (params.productId) where.product_id = params.productId;
        if (params.startDate || params.endDate) {
          where.transfer_date = {};
          if (params.startDate) where.transfer_date.gte = params.startDate;
          if (params.endDate) where.transfer_date.lte = params.endDate;
        }
        const transfers = await prisma.transfer.findMany({
          where,
          include: {
            product: true,
            from_branch: true,
            to_branch: true,
          },
          orderBy: { transfer_date: 'desc' },
        });
        return {
          data: transfers,
          summary: { count: transfers.length, completed: transfers.filter(t => t.status === 'RECEIVED').length }
        };
      }

      case 'stockout': {
        const where: Prisma.StockMovementWhereInput = {
          movement_type: { in: ['SALE', 'DAMAGE', 'LOSS', 'EXPIRED'] },
        };
        if (params.branchId) where.branch_id = params.branchId;
        if (params.productId) where.product_id = params.productId;
        if (params.startDate || params.endDate) {
          where.created_at = {};
          if (params.startDate) where.created_at.gte = params.startDate;
          if (params.endDate) where.created_at.lte = params.endDate;
        }
        const movements = await prisma.stockMovement.findMany({
          where,
          include: { product: true, branch: true },
          orderBy: { created_at: 'desc' },
        });
        const totalQty = movements.reduce((acc, m) => acc + Math.abs(asNumber(m.quantity_change)), 0);
        return {
          data: movements,
          summary: { count: movements.length, totalQty, damageCount: movements.filter(m => m.movement_type === 'DAMAGE').length }
        };
      }

      case 'lowstock': {
        const stocks = await prisma.stock.findMany({
          where: params.branchId ? { branch_id: params.branchId } : {},
          include: { product: true, branch: true },
        });
        const items = stocks.filter((s) => {
          const minQty = asNumber((s.product as any).min_qty ?? s.minimum_quantity ?? 0);
          return minQty > 0 && asNumber(s.current_quantity) <= minQty;
        });
        return {
          data: items,
          summary: { criticalCount: items.filter(i => asNumber(i.current_quantity) <= 0).length, warningCount: items.length }
        };
      }

      case 'aging': {
        const stocks = await prisma.stock.findMany({
          where: params.branchId ? { branch_id: params.branchId } : {},
          include: { product: true, branch: true },
        });
        
        const data = await Promise.all(stocks.map(async (s: any) => {
          const lastMovement = await prisma.stockMovement.findFirst({
            where: { product_id: s.product_id, branch_id: s.branch_id },
            orderBy: { created_at: 'desc' },
            select: { created_at: true }
          });
          const lastDate = lastMovement?.created_at || s.last_updated;
          const daysOld = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          return {
            product: s.product,
            branch: s.branch,
            currentQuantity: asNumber(s.current_quantity),
            daysOld,
            lastAction: lastDate
          };
        }));
        
        return {
          data: data.sort((a, b) => b.daysOld - a.daysOld),
          summary: { avgAge: data.length ? data.reduce((acc, d) => acc + d.daysOld, 0) / data.length : 0, deadStockCount: data.filter(d => d.daysOld > 90).length }
        };
      }

      case 'movement_summary': {
        const where: Prisma.StockMovementWhereInput = {};
        if (params.branchId) where.branch_id = params.branchId;
        if (params.startDate || params.endDate) {
          where.created_at = {};
          if (params.startDate) where.created_at.gte = params.startDate;
          if (params.endDate) where.created_at.lte = params.endDate;
        }

        const stats = await prisma.stockMovement.groupBy({
          by: ['movement_type'],
          where,
          _sum: { quantity_change: true },
          _count: true
        });

        return {
          data: stats,
          summary: { totalMovements: stats.reduce((acc, s) => acc + s._count, 0) }
        };
      }

      case 'financial_audit': {
        const where: Prisma.SaleWhereInput = {
          status: 'COMPLETED'
        };
        if (params.branchId) where.branch_id = params.branchId;
        if (params.startDate || params.endDate) {
          where.sale_date = {};
          if (params.startDate) where.sale_date.gte = params.startDate;
          if (params.endDate) where.sale_date.lte = params.endDate;
        }

        const sales = await prisma.sale.findMany({
          where,
          include: {
            sale_items: {
              include: { product: true }
            },
            branch: true
          }
        });

        let totalRevenue = 0;
        let totalCOGS = 0;
        const branchPerformance: Record<string, { name: string, revenue: number, cogs: number, profit: number, count: number }> = {};

        sales.forEach(sale => {
          const filteredItems = sale.sale_items.filter(item => {
            if (params.productId && item.product_id !== params.productId) return false;
            if (params.categoryId && item.product.category_id !== params.categoryId) return false;
            return true;
          });

          if (filteredItems.length === 0) return;

          const bId = sale.branch_id || 'unknown';
          if (!branchPerformance[bId]) {
            branchPerformance[bId] = { name: (sale.branch as any)?.name || 'Central', revenue: 0, cogs: 0, profit: 0, count: 0 };
          }
          branchPerformance[bId].count += 1;

          filteredItems.forEach(item => {
            const rev = asNumber(item.line_total);
            const cost = asNumber(item.product.purchase_rate) * asNumber(item.quantity);
            
            totalRevenue += rev;
            totalCOGS += cost;

            branchPerformance[bId].revenue += rev;
            branchPerformance[bId].cogs += cost;
            branchPerformance[bId].profit += (rev - cost);
          });
        });

        return {
          data: Object.values(branchPerformance),
          summary: {
            totalRevenue,
            totalCOGS,
            grossProfit: totalRevenue - totalCOGS,
            profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
            transactionCount: sales.length
          }
        };
      }

      default:
        return { data: [], summary: {} };
    }
  }
}
