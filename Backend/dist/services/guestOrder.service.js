"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestOrderService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const apiError_1 = require("../utils/apiError");
const email_service_1 = require("../utils/email.service");
class GuestOrderService {
    formatGuestOrder(order) {
        const fullName = order.customer_name || '';
        const [firstName, ...lastNameParts] = fullName.trim().split(' ').filter(Boolean);
        return {
            ...order,
            customer: {
                firstName: firstName || '',
                lastName: lastNameParts.join(' ') || '',
                email: order.customer_email || '',
                phone: order.customer_phone || '',
            },
            shipping: {
                address: order.delivery_address || '',
                city: order.delivery_city || '',
                postalCode: order.delivery_postal_code || '',
            },
            orderNotes: order.order_notes || '',
        };
    }
    resolveItemProductId(item) {
        const raw = (item.productId || item.id)?.trim();
        if (!raw)
            return undefined;
        const uuidMatch = raw.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        return uuidMatch ? uuidMatch[1] : raw;
    }
    async applyStockUpdatesBestEffort(items, products) {
        const productIds = items
            .map((item) => this.resolveItemProductId(item))
            .filter((id) => Boolean(id));
        const stockRecords = await client_2.prisma.stock.findMany({
            where: { product_id: { in: productIds } },
        });
        for (const item of items) {
            const productId = this.resolveItemProductId(item);
            if (!productId)
                continue;
            const product = products.find((p) => p.id === productId);
            const stock = stockRecords.find((s) => s.product_id === productId);
            if (!stock || !product) {
                if (product) {
                    console.warn(`No stock record found for product ${product.name} (${product.id}). Order will proceed without stock update.`);
                }
                continue;
            }
            const qty = new client_1.Prisma.Decimal(item.quantity);
            try {
                await client_2.prisma.$transaction([
                    client_2.prisma.stock.update({
                        where: {
                            product_id_branch_id: {
                                product_id: product.id,
                                branch_id: stock.branch_id,
                            },
                        },
                        data: { current_quantity: { decrement: qty } },
                    }),
                    client_2.prisma.stockMovement.create({
                        data: {
                            product: { connect: { id: product.id } },
                            branch: { connect: { id: stock.branch_id } },
                            movement_type: 'SALE',
                            quantity_change: qty.negated(),
                            previous_qty: stock.current_quantity,
                            new_qty: stock.current_quantity.minus(qty),
                        },
                    }),
                ]);
            }
            catch (err) {
                console.warn(`Stock update skipped for ${product.name} (${product.id}):`, err instanceof Error ? err.message : err);
            }
        }
    }
    async createGuestOrder(data) {
        const productIds = data.items
            .map((item) => this.resolveItemProductId(item))
            .filter((id) => Boolean(id));
        if (productIds.length !== data.items.length) {
            throw new apiError_1.AppError(400, 'Product ID is missing in one or more items');
        }
        const uniqueProductIds = [...new Set(productIds)];
        const products = await client_2.prisma.product.findMany({
            where: {
                id: { in: uniqueProductIds },
                is_active: true,
            },
        });
        if (products.length !== uniqueProductIds.length) {
            throw new apiError_1.AppError(400, 'One or more products not found or inactive');
        }
        const orderItems = [];
        for (const item of data.items) {
            const productId = this.resolveItemProductId(item);
            if (!productId) {
                throw new apiError_1.AppError(400, `Product ID is missing for item: ${item.name}`);
            }
            const product = products.find((p) => p.id === productId);
            if (!product) {
                throw new apiError_1.AppError(400, `Product not found for item: ${item.name}`);
            }
            const qty = new client_1.Prisma.Decimal(item.quantity);
            const unitPrice = new client_1.Prisma.Decimal(item.price);
            const lineTotal = unitPrice.times(qty);
            orderItems.push({
                product: { connect: { id: product.id } },
                display_name: item.name,
                grams_per_unit: item.gramsPerUnit != null && item.gramsPerUnit > 0
                    ? new client_1.Prisma.Decimal(item.gramsPerUnit)
                    : undefined,
                unit_name: item.unitName?.trim() || undefined,
                quantity: qty,
                price: unitPrice,
                total_price: lineTotal,
            });
        }
        if (orderItems.length === 0) {
            throw new apiError_1.AppError(400, 'No valid order items found');
        }
        const orderNumber = `MP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const totalAmount = new client_1.Prisma.Decimal(data.total);
        const order = await client_2.prisma.order.create({
            data: {
                order_number: orderNumber,
                customer_id: null,
                customer_name: `${data.customer.firstName} ${data.customer.lastName}`.trim(),
                customer_email: data.customer.email,
                customer_phone: data.customer.phone,
                delivery_address: data.shipping.address,
                delivery_city: data.shipping.city,
                delivery_postal_code: data.shipping.postalCode ?? null,
                order_notes: data.orderNotes,
                total_amount: totalAmount,
                status: 'PENDING',
                payment_method: data.paymentMethod.toUpperCase(),
                items: { create: orderItems },
            },
            include: {
                items: { include: { product: { include: { unit: true } } } },
            },
        });
        if (!order.items?.length) {
            throw new apiError_1.AppError(500, 'Order created without item details');
        }
        // Stock is optional — never block checkout
        void this.applyStockUpdatesBestEffort(data.items, products);
        const emailData = {
            orderNumber,
            customerName: `${data.customer.firstName} ${data.customer.lastName}`,
            customerEmail: data.customer.email,
            customerPhone: data.customer.phone,
            shippingAddress: data.shipping,
            items: data.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            })),
            subtotal: data.subtotal,
            shipping: data.shippingCost,
            total: data.total,
            paymentMethod: data.paymentMethod,
            orderNotes: data.orderNotes,
        };
        email_service_1.EmailService.sendOrderConfirmationEmails(emailData).catch((err) => {
            console.error('Failed to send order confirmation emails:', err);
        });
        return this.formatGuestOrder(order);
    }
    async getGuestOrders(status, page = 1, pageSize = 10) {
        const where = {
            customer_id: null, // Only guest orders (no customer_id)
        };
        if (status) {
            where.status = status;
        }
        const [orders, total] = await Promise.all([
            client_2.prisma.order.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    items: {
                        include: {
                            product: { include: { unit: true } },
                        },
                    },
                },
            }),
            client_2.prisma.order.count({ where }),
        ]);
        return {
            data: orders.map((order) => this.formatGuestOrder(order)),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    async getGuestOrderById(orderId) {
        const order = await client_2.prisma.order.findFirst({
            where: {
                id: orderId,
                customer_id: null, // Ensure it's a guest order
            },
            include: {
                items: {
                    include: {
                        product: { include: { unit: true } },
                    },
                },
            },
        });
        if (!order) {
            throw new apiError_1.AppError(404, 'Guest order not found');
        }
        return this.formatGuestOrder(order);
    }
}
exports.GuestOrderService = GuestOrderService;
//# sourceMappingURL=guestOrder.service.js.map