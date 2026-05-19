import { Prisma, SaleItemType, SaleStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';

interface ReturnItem {
  productId: string;
  quantity: number;
}

interface ExchangeItem {
  productId: string;
  quantity: number;
  price: number;
}

interface HoldSaleCartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  actualUnitPrice?: number;
  quantity: number;
  category?: string;
  unitId?: string;
  unitName?: string;
  unit?: string;
}

class SaleService {
  async getSales({
    branchId,
    page,
    limit,
    search,
    startDate,
    endDate,
  }: {
    branchId?: string;
    page?: number;
    limit?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.SaleWhereInput = {
      ...(branchId ? { branch_id: branchId } : {}),
      ...(search
        ? {
            OR: [
              { sale_number: { contains: search, mode: 'insensitive' } },
              { customer: { email: { contains: search, mode: 'insensitive' } } },
              { customer: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(startDate || endDate
        ? {
            sale_date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const include = {
      sale_items: {
        include: { product: true },
      },
      customer: true,
      branch: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    };

    // Backward-compatible behavior: when pagination is not requested, return all rows.
    if (!page || !limit) {
      const data = await prisma.sale.findMany({
        where,
        include,
        orderBy: { sale_date: 'desc' },
      });
      return {
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        },
      };
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const skip = (safePage - 1) * safeLimit;

    const [total, data] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include,
        orderBy: { sale_date: 'desc' },
        skip,
        take: safeLimit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getSalesForReturns({ branchId, search }: { branchId?: string; search?: string }) {
    const normalizedSearch = search?.replace(/\s+/g, ' ').trim();

    return prisma.sale.findMany({
      where: {
        branch_id: branchId,
        status: 'COMPLETED', // Only completed sales can be returned
        ...(normalizedSearch
          ? {
              OR: [
                { sale_number: { contains: normalizedSearch, mode: 'insensitive' } },
                { customer: { name: { contains: normalizedSearch, mode: 'insensitive' } } },
                { customer: { email: { contains: normalizedSearch, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        sale_items: {
          include: { product: true },
        },
        customer: true,
      },
      orderBy: { sale_date: 'desc' },
      take: 50, // Limit results for performance
    });
  }

  async getSaleById(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        sale_items: {
          include: { product: true },
        },
        customer: true,
      },
    });
    if (!sale) throw new AppError(404, 'Sale not found');
    return sale;
  }

  async getHoldSales({ branchId }: { branchId: string }) {
    return prisma.holdSale.findMany({
      where: { branch_id: branchId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createHoldSale({
    branchId,
    customerId,
    createdBy,
    items,
  }: {
    branchId: string;
    customerId?: string;
    createdBy?: string;
    items: HoldSaleCartItem[];
  }) {
    if (!items?.length) {
      throw new AppError(400, 'No items provided for hold sale');
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new AppError(400, 'Invalid branch');
    }

    const normalizedItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      originalPrice: Number(item.originalPrice ?? item.price),
      actualUnitPrice: Number(item.actualUnitPrice ?? item.price),
      quantity: Number(item.quantity),
      category: item.category,
      unitId: item.unitId,
      unitName: item.unitName,
      unit: item.unit,
    }));

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + (item.actualUnitPrice || item.price) * item.quantity,
      0,
    );

    return prisma.holdSale.create({
      data: {
        branch_id: branchId,
        customer_id: customerId,
        created_by: createdBy,
        items: normalizedItems as Prisma.InputJsonValue,
        subtotal: new Prisma.Decimal(subtotal),
        total_items: normalizedItems.length,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async retrieveHoldSale({
    holdSaleId,
    branchId,
  }: {
    holdSaleId: string;
    branchId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const holdSale = await tx.holdSale.findFirst({
        where: { id: holdSaleId, branch_id: branchId },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!holdSale) {
        throw new AppError(404, 'Hold sale not found');
      }

      await tx.holdSale.delete({
        where: { id: holdSaleId },
      });

      return holdSale;
    });
  }

  async deleteHoldSale({
    holdSaleId,
    branchId,
  }: {
    holdSaleId: string;
    branchId: string;
  }) {
    const holdSale = await prisma.holdSale.findFirst({
      where: { id: holdSaleId, branch_id: branchId },
      select: { id: true },
    });

    if (!holdSale) {
      throw new AppError(404, 'Hold sale not found');
    }

    await prisma.holdSale.delete({ where: { id: holdSaleId } });
  }

  async createSale({
    branchId,
    customerId,
    paymentMethod,
    items,
    discountAmount,
    createdBy,
  }: {
    branchId: string;
    customerId?: string;
    paymentMethod: Prisma.SaleCreateInput['payment_method'];
    items: Array<{ productId: string; quantity: number; price: number }>;
    discountAmount?: number;
    createdBy: string;
  }) {
    // 1) Validate OUTSIDE any interactive transaction
    const [customer, branch] = await Promise.all([
      customerId ? prisma.customer.findUnique({ where: { id: customerId } }) : null,
      prisma.branch.findUnique({ where: { id: branchId } }),
    ]);
    if (customerId && !customer) throw new AppError(400, 'Invalid customer');
    if (!branch) throw new AppError(400, 'Invalid branch');
    if (!items.length) throw new AppError(400, 'No items provided');
  
    // 2) Validate that all products exist
    const productIds = items.map(i => i.productId);
    const uniqueProductIds = [...new Set(productIds)]; // Remove duplicates
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true },
    });
    const foundProductIds = new Set(products.map(p => p.id));
    const missingProductIds = uniqueProductIds.filter(id => !foundProductIds.has(id));
    if (missingProductIds.length > 0) {
      throw new AppError(400, `Products not found: ${missingProductIds.join(', ')}`);
    }
  
    // 3) Pre-fetch stock snapshot once
    const stocks = await prisma.stock.findMany({
      where: { product_id: { in: productIds }, branch_id: branchId },
    });
    const stockMap = new Map(stocks.map(s => [s.product_id, s]));
  
    // 4) Group same product lines and compute movements in memory
    const grouped = items.reduce<Record<string, { productId: string; qty: Prisma.Decimal }>>(
      (acc, it) => {
        const key = it.productId;
        if (!acc[key]) acc[key] = { productId: it.productId, qty: new Prisma.Decimal(0) };
        acc[key].qty = acc[key].qty.plus(it.quantity);
        return acc;
      },
      {}
    );
  
    type MoveRow = {
      product_id: string;
      previous_qty: Prisma.Decimal;
      new_qty: Prisma.Decimal;
      quantity_change: Prisma.Decimal; // negative for sale
    };
  
    const movements: MoveRow[] = [];
    for (const gp of Object.values(grouped)) {
      const existing = stockMap.get(gp.productId);
      const prev = new Prisma.Decimal(existing?.current_quantity ?? 0);
      const change = gp.qty.mul(-1); // sale => decrement
      const next = prev.plus(change);
  
      // allow negative stock per your testing; add a check here if you want to block it
      movements.push({
        product_id: gp.productId,
        previous_qty: prev,
        new_qty: next,
        quantity_change: change,
      });
  
      stockMap.set(gp.productId, {
        ...(existing ?? ({} as any)),
        product_id: gp.productId,
        branch_id: branchId,
        current_quantity: next,
      });
    }
  
    // 5) Prepare all writes as a single non-interactive transaction (prevents P2028)
    const subtotalAmt = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const finalDiscount = discountAmount ?? 0;
    const finalTotal = Math.max(0, subtotalAmt - finalDiscount);
  
    const ops: Prisma.PrismaPromise<any>[] = [];
  
    // (a) Sale + items
    ops.push(
      prisma.sale.create({
        data: {
          sale_number: `SALE-${Date.now()}`,
          branch_id: branchId,
          customer_id: customerId,
          total_amount: new Prisma.Decimal(finalTotal),
          subtotal: new Prisma.Decimal(subtotalAmt),
          discount_amount: new Prisma.Decimal(finalDiscount),
          payment_method: paymentMethod,
          payment_status: 'PAID',
          status: 'COMPLETED',
          created_by: createdBy,
          sale_items: {
            create: items.map((item) => ({
              product: { connect: { id: item.productId } },
              quantity: new Prisma.Decimal(item.quantity),
              unit_price: new Prisma.Decimal(item.price),
              line_total: new Prisma.Decimal(item.price).mul(item.quantity),
            })),
          },
        },
        include: { sale_items: true },
      })
    );
  
    // (b) Stock upserts (one per product)
    for (const m of movements) {
      const decAbs = m.quantity_change.abs(); // positive decrement amount
      ops.push(
        prisma.stock.upsert({
          where: {
            product_id_branch_id: {
              product_id: m.product_id,
              branch_id: branchId,
            },
          },
          update: {
            current_quantity: { decrement: decAbs },
          },
          create: {
            product_id: m.product_id,
            branch_id: branchId,
            current_quantity: m.new_qty, // start at computed value (can be negative)
            minimum_quantity: new Prisma.Decimal(0),
            maximum_quantity: new Prisma.Decimal(1000),
            reserved_quantity: new Prisma.Decimal(0),
          },
        })
      );
    }
  
    // (c) Stock movements (use computed prev/new; no read-after-write)
    for (const m of movements) {
      ops.push(
        prisma.stockMovement.create({
          data: {
            product_id: m.product_id,
            branch_id: branchId,
            movement_type: 'SALE',
            quantity_change: m.quantity_change, // negative
            previous_qty: m.previous_qty,
            new_qty: m.new_qty,
            created_by: createdBy,
          },
        })
      );
    }
  
    const [sale] = await prisma.$transaction(ops);
    const saleResult = sale as Prisma.SaleGetPayload<{ include: { sale_items: true } }>;
    
    return saleResult;
  }
  

  async getTodaySales({ branchId }: { branchId?: string }) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return prisma.sale.findMany({
      where: {
        branch_id: branchId,
        sale_date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        customer: true,
      },
      orderBy: { sale_date: 'desc' },
    });
  }

  // async createExchangeOrReturnSale({
  //     originalSaleId,
  //     branchId,
  //     customerId,
  //     returnedItems,
  //     exchangedItems,
  //     createdBy
  // }: {
  //     originalSaleId: string,
  //     branchId: string,
  //     customerId?: string,
  //     returnedItems: { productId: string, quantity: number }[],
  //     exchangedItems: { productId: string, quantity: number, price: number }[],
  //     createdBy: string,
  // }) {
  //     return prisma.$transaction(async (tx) => {
  //         const originalSale = await tx.sale.findUnique({
  //             where: { id: originalSaleId },
  //             include: { sale_items: true },
  //         });
  //         if (!originalSale) throw new AppError(404, "Original sale not found");

  //         const productIds = [
  //             ...returnedItems.map(i => i.productId),
  //             ...exchangedItems.map(i => i.productId)
  //         ];

  //         const stocks = await tx.stock.findMany({
  //             where: { product_id: { in: productIds }, branch_id: branchId }
  //         });

  //         const saleItems: any[] = [];
  //         let total = 0;

  //         // Process Returns
  //         for (const ret of returnedItems) {
  //             const stock = stocks.find(s => s.product_id === ret.productId);
  //             if (!stock) throw new AppError(400, `Stock not found for product ${ret.productId}`);

  //             const originalItem = originalSale.sale_items.find(i => i.product_id === ret.productId);
  //             if (!originalItem) throw new AppError(400, `Product ${ret.productId} not in original sale`);

  //             if (ret.quantity > originalItem.quantity) {
  //                 throw new AppError(400, `Return quantity exceeds original`);
  //             }

  //             await tx.stock.update({
  //                 where: {
  //                     product_id_branch_id: {
  //                         product_id: ret.productId,
  //                         branch_id: branchId,
  //                     }
  //                 },
  //                 data: { current_quantity: { increment: ret.quantity } }
  //             });

  //             await tx.stockMovement.create({
  //                 data: {
  //                     product_id: ret.productId,
  //                     branch_id: branchId,
  //                     movement_type: "RETURN",
  //                     quantity_change: ret.quantity,
  //                     previous_qty: 0,
  //                     new_qty: 0,
  //                     created_by: createdBy,
  //                 },
  //             });

  //             const lineTotal = -(Number(originalItem.unit_price) * ret.quantity);
  //             total += lineTotal;

  //             saleItems.push({
  //                 product_id: ret.productId,
  //                 quantity: -ret.quantity,
  //                 unit_price: originalItem.unit_price,
  //                 line_total: lineTotal,
  //                 item_type: "RETURN",
  //                 ref_sale_item_id: originalItem.id
  //             });
  //         }

  //         // Process Exchanges
  //         for (const item of exchangedItems) {
  //             const stock = stocks.find(s => s.product_id === item.productId);
  //             if (!stock || stock.current_quantity < item.quantity) {
  //                 throw new AppError(400, `Insufficient stock for exchange product ${item.productId}`);
  //             }

  //             await tx.stock.update({
  //                 where: {
  //                     product_id_branch_id: {
  //                         product_id: item.productId,
  //                         branch_id: branchId,
  //                     }
  //                 },
  //                 data: { current_quantity: { decrement: item.quantity } }
  //             });

  //             await tx.stockMovement.create({
  //                 data: {
  //                     product_id: item.productId,
  //                     branch_id: branchId,
  //                     movement_type: "SALE",
  //                     quantity_change: -item.quantity,
  //                     previous_qty: stock.current_quantity,
  //                     new_qty: stock.current_quantity - item.quantity,
  //                     created_by: createdBy,
  //                 },
  //             });

  //             const lineTotal = item.price * item.quantity;
  //             total += lineTotal;

  //             saleItems.push({
  //                 product_id: item.productId,
  //                 quantity: item.quantity,
  //                 unit_price: item.price,
  //                 line_total: lineTotal,
  //                 item_type: "EXCHANGE"
  //             });
  //         }

  //         const sale = await tx.sale.create({
  //             data: {
  //                 sale_number: `SALE-${Date.now()}`,
  //                 branch_id: branchId,
  //                 customer_id: customerId,
  //                 original_sale_id: originalSaleId,
  //                 total_amount: total,
  //                 subtotal: total,
  //                 payment_method: "CASH",
  //                 payment_status: "PAID",
  //                 status: "COMPLETED",
  //                 created_by: createdBy,
  //                 sale_items: {
  //                     create: saleItems,
  //                 },
  //             },
  //             include: { sale_items: true },
  //         });

  //         return sale;
  //     });
  // }

  async createExchangeOrReturnSale({
    originalSaleId,
    branchId,
    customerId,
    returnedItems,
    exchangedItems,
    notes,
    createdBy,
  }: {
    originalSaleId: string;
    // Optional: the controller couldn't know the right branch when an admin
    // (with no `branch_id` on their JWT) hits this endpoint. We resolve the
    // branch from the original sale before any stock-touching query runs.
    branchId?: string | null;
    customerId?: string;
    returnedItems: ReturnItem[];
    exchangedItems: ExchangeItem[];
    notes?: string;
    createdBy: string;
  }) {
    if (!returnedItems.length && !exchangedItems.length) {
      throw new AppError(400, 'No return or exchange items provided');
    }

    const uniqueProductIds = [...new Set([
      ...returnedItems.map((item) => item.productId),
      ...exchangedItems.map((item) => item.productId),
    ])];
    const uniqueExchangeProductIds = [...new Set(exchangedItems.map((item) => item.productId))];

    // Step 1 — load the original sale first so we can derive the branch when
    // the caller didn't (or couldn't) provide one. We MUST resolve a real
    // branch_id before touching prisma.stock.findMany, which rejects null.
    const originalSale = await prisma.sale.findUnique({
      where: { id: originalSaleId },
      include: { sale_items: true },
    });
    if (!originalSale) throw new AppError(400, 'Original sale not found');

    // Guard against duplicate refunds/exchanges. Without this check the same
    // sale can be refunded N times — the UI's "Ready for return" panel keeps
    // showing it because the original sale stays COMPLETED, and stock keeps
    // getting re-credited on every retry.
    if (originalSale.status === SaleStatus.REFUNDED || originalSale.status === SaleStatus.EXCHANGED) {
      throw new AppError(
        400,
        `This sale has already been ${originalSale.status === SaleStatus.REFUNDED ? 'refunded' : 'exchanged'}.`,
      );
    }

    const resolvedBranchId: string | null =
      (branchId && branchId.trim()) || originalSale.branch_id || null;
    if (!resolvedBranchId) {
      throw new AppError(
        400,
        'Branch is required for a refund/exchange. Provide branchId in the request, or assign a branch to the original sale.',
      );
    }

    // Step 2 — now that branchId is guaranteed non-null, fan out the
    // remaining lookups in parallel.
    const [branch, customer, exchangeProducts, stocks] = await Promise.all([
      prisma.branch.findUnique({
        where: { id: resolvedBranchId },
        select: { id: true },
      }),
      customerId
        ? prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true },
          })
        : Promise.resolve(null),
      uniqueExchangeProductIds.length
        ? prisma.product.findMany({
            where: { id: { in: uniqueExchangeProductIds } },
            select: { id: true },
          })
        : Promise.resolve([] as Array<{ id: string }>),
      uniqueProductIds.length
        ? prisma.stock.findMany({
            where: {
              product_id: { in: uniqueProductIds },
              branch_id: resolvedBranchId,
            },
          })
        : Promise.resolve([] as Array<{ product_id: string; current_quantity: Prisma.Decimal }>),
    ]);

    if (!branch) throw new AppError(400, 'Invalid branch');
    if (customerId && !customer) throw new AppError(400, 'Invalid customer');

    const foundExchangeProductIds = new Set(exchangeProducts.map((product) => product.id));
    const missingExchangeProductIds = uniqueExchangeProductIds.filter(
      (productId) => !foundExchangeProductIds.has(productId),
    );
    if (missingExchangeProductIds.length > 0) {
      throw new AppError(400, `Products not found: ${missingExchangeProductIds.join(', ')}`);
    }

    for (const ret of returnedItems) {
      const originalItem = originalSale.sale_items.find((item) => item.product_id === ret.productId);
      if (!originalItem) {
        throw new AppError(400, `Product ${ret.productId} not found in original sale`);
      }
      if (ret.quantity > originalItem.quantity.toNumber()) {
        throw new AppError(
          400,
          `Return quantity (${ret.quantity}) exceeds original sale quantity (${originalItem.quantity}) for product ${ret.productId}`,
        );
      }
    }

    type MovementRow = {
      product_id: string;
      movement_type: StockMovementType;
      quantity_change: Prisma.Decimal;
      previous_qty: Prisma.Decimal;
      new_qty: Prisma.Decimal;
      reference_type: string;
      notes: string;
    };

    const saleItems: Prisma.SaleItemUncheckedCreateWithoutSaleInput[] = [];
    const movementRows: MovementRow[] = [];
    const stockNetChanges = new Map<string, Prisma.Decimal>();
    const stockQuantityMap = new Map<string, Prisma.Decimal>(
      stocks.map((stock) => [stock.product_id, new Prisma.Decimal(stock.current_quantity)]),
    );
    let total = new Prisma.Decimal(0);
    const hasReturn = returnedItems.length > 0;
    const hasExchange = exchangedItems.length > 0;

    const recordMovement = ({
      productId,
      change,
      movementType,
      referenceType,
      notes: movementNote,
    }: {
      productId: string;
      change: Prisma.Decimal;
      movementType: StockMovementType;
      referenceType: string;
      notes: string;
    }) => {
      const previousQty = stockQuantityMap.get(productId) ?? new Prisma.Decimal(0);
      const newQty = previousQty.plus(change);

      stockQuantityMap.set(productId, newQty);
      stockNetChanges.set(productId, (stockNetChanges.get(productId) ?? new Prisma.Decimal(0)).plus(change));
      movementRows.push({
        product_id: productId,
        movement_type: movementType,
        quantity_change: change,
        previous_qty: previousQty,
        new_qty: newQty,
        reference_type: referenceType,
        notes: movementNote,
      });
    };

    for (const ret of returnedItems) {
      const originalItem = originalSale.sale_items.find((item) => item.product_id === ret.productId);
      if (!originalItem) {
        throw new AppError(400, `Product ${ret.productId} not in original sale`);
      }

      const returnQuantity = new Prisma.Decimal(ret.quantity);
      const lineTotal = new Prisma.Decimal(originalItem.unit_price).mul(returnQuantity).mul(-1);
      total = total.plus(lineTotal);

      recordMovement({
        productId: ret.productId,
        change: returnQuantity,
        movementType: StockMovementType.RETURN,
        referenceType: 'return',
        notes: 'Returned by customer',
      });

      saleItems.push({
        product_id: ret.productId,
        quantity: returnQuantity.mul(-1),
        unit_price: originalItem.unit_price,
        tax_rate: originalItem.tax_rate,
        discount_rate: originalItem.discount_rate,
        tax_amount: new Prisma.Decimal(0),
        discount_amount: new Prisma.Decimal(0),
        line_total: lineTotal,
        item_type: SaleItemType.RETURN,
        ref_sale_item_id: originalItem.id,
      });
    }

    for (const item of exchangedItems) {
      const exchangeQuantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.price);
      const lineTotal = unitPrice.mul(exchangeQuantity);
      total = total.plus(lineTotal);

      recordMovement({
        productId: item.productId,
        change: exchangeQuantity.mul(-1),
        movementType: StockMovementType.SALE,
        referenceType: 'exchange',
        notes: 'Exchanged to customer',
      });

      saleItems.push({
        product_id: item.productId,
        quantity: exchangeQuantity,
        unit_price: unitPrice,
        tax_rate: new Prisma.Decimal(0),
        discount_rate: new Prisma.Decimal(0),
        tax_amount: new Prisma.Decimal(0),
        discount_amount: new Prisma.Decimal(0),
        line_total: lineTotal,
        item_type: SaleItemType.EXCHANGE,
      });
    }

    const ops: Prisma.PrismaPromise<any>[] = [];
    ops.push(
      prisma.sale.create({
        data: {
          sale_number: `SALE-${Date.now()}`,
          branch_id: resolvedBranchId,
          customer_id: customerId,
          original_sale_id: originalSaleId,
          notes,
          subtotal: total,
          total_amount: total,
          payment_method: 'CASH',
          payment_status: 'PAID',
          status:
            hasReturn && hasExchange
              ? SaleStatus.EXCHANGED
              : hasReturn
                ? SaleStatus.REFUNDED
                : SaleStatus.EXCHANGED,
          created_by: createdBy,
          sale_items: {
            create: saleItems,
          },
        },
        include: {
          sale_items: true,
        },
      }),
    );

    // Flip the ORIGINAL sale into a terminal state so it stops appearing in
    // "ready for return" lists and the duplicate-refund guard above can
    // intercept any retry. This is what makes the UI eventually-consistent:
    // - getSalesForReturns filters by status === COMPLETED → drops it.
    // - The returns list filters by status in (REFUNDED, EXCHANGED) → includes it.
    const originalNewStatus =
      hasReturn && hasExchange
        ? SaleStatus.EXCHANGED
        : hasReturn
          ? SaleStatus.REFUNDED
          : SaleStatus.EXCHANGED;
    ops.push(
      prisma.sale.update({
        where: { id: originalSaleId },
        data: { status: originalNewStatus },
      }),
    );

    for (const [productId, quantityChange] of stockNetChanges.entries()) {
      ops.push(
        prisma.stock.upsert({
          where: {
            product_id_branch_id: {
              product_id: productId,
              branch_id: resolvedBranchId,
            },
          },
          update: {
            current_quantity: {
              increment: quantityChange,
            },
          },
          create: {
            product_id: productId,
            branch_id: resolvedBranchId,
            current_quantity: quantityChange,
            minimum_quantity: new Prisma.Decimal(0),
            maximum_quantity: new Prisma.Decimal(1000),
            reserved_quantity: new Prisma.Decimal(0),
          },
        }),
      );
    }

    if (movementRows.length > 0) {
      ops.push(
        prisma.stockMovement.createMany({
          data: movementRows.map((movement) => ({
            product_id: movement.product_id,
            branch_id: resolvedBranchId,
            movement_type: movement.movement_type,
            reference_id: originalSaleId,
            reference_type: movement.reference_type,
            quantity_change: movement.quantity_change,
            previous_qty: movement.previous_qty,
            new_qty: movement.new_qty,
            notes: movement.notes,
            created_by: createdBy,
          })),
        }),
      );
    }

    const [sale] = await prisma.$transaction(ops);
    return sale as Prisma.SaleGetPayload<{ include: { sale_items: true } }>;
  }

  async getRecentSaleItemsProductNameAndPrice(branchId?: string) {
    const sale = await prisma.sale.findFirst({
      where: branchId ? { branch_id: branchId } : undefined,
      orderBy: { sale_date: 'desc' },
      include: {
        sale_items: {
          orderBy: { id: 'desc' },
          take: 5,
          include: { product: true },
        },
      },
    });
    if (!sale || sale.sale_items.length === 0) return [];
    return sale.sale_items.map((item) => ({
      productName: item.product.name,
      price: item.unit_price,
    }));
  }
}
export { SaleService };
