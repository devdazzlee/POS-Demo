import { TransferStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { addDecimal, asNumber } from '../utils/helpers';
import { Prisma } from '@prisma/client';

function generateTransferRef(): string {
  return `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export class TransferService {
  async createTransfer(data: {
    productId: string;
    quantity: number;
    fromBranchId: string;
    toBranchId: string;
    notes?: string;
    createdBy: string;
    reason?: string;
    carrierName?: string;
    vehicleNo?: string;
    estimatedArrival?: string | Date;
    receiverName?: string;
  }) {
    if (data.fromBranchId === data.toBranchId) {
      throw new AppError(400, 'Cannot transfer to the same location');
    }
    if (data.quantity <= 0) {
      throw new AppError(400, 'Quantity must be greater than 0');
    }

    return prisma.$transaction(async (tx) => {
      const sourceStock = await tx.stock.findUnique({
        where: {
          product_id_branch_id: {
            product_id: data.productId,
            branch_id: data.fromBranchId,
          },
        },
      });

      if (!sourceStock) {
        throw new AppError(404, 'Source stock not found');
      }

      const sourceQty = asNumber(sourceStock.current_quantity);
      if (sourceQty < data.quantity) {
        throw new AppError(400, 'Insufficient stock for transfer');
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

      const newSourceQty = addDecimal(sourceStock.current_quantity, -data.quantity);
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

      let finalDestQty: number | Prisma.Decimal;
      if (!destStock) {
        destStock = await tx.stock.create({
          data: {
            product_id: data.productId,
            branch_id: data.toBranchId,
            current_quantity: data.quantity,
          },
        });
        finalDestQty = data.quantity;
      } else {
        finalDestQty = addDecimal(destStock.current_quantity, data.quantity);
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

  async updateTransferStatus(
    id: string,
    status: TransferStatus,
    userId?: string
  ) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { product: true, from_branch: true, to_branch: true },
    });

    if (!transfer) throw new AppError(404, 'Transfer not found');

    const updateData: {
      status: TransferStatus;
      received_at?: Date;
      received_by?: string;
    } = { status };
    if (status === 'RECEIVED') {
      updateData.received_at = new Date();
      if (userId) updateData.received_by = userId;
    }

    return prisma.transfer.update({
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

  async listTransfers(params: {
    page?: number;
    limit?: number;
    fromBranchId?: string;
    toBranchId?: string;
    productId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    branchId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransferWhereInput = {};
    if (params.fromBranchId) where.from_branch_id = params.fromBranchId;
    if (params.toBranchId) where.to_branch_id = params.toBranchId;
    if (params.productId) where.product_id = params.productId;
    if (params.status) where.status = params.status as any;
    if (params.branchId) {
      where.OR = [
        { from_branch_id: params.branchId },
        { to_branch_id: params.branchId },
      ];
    }
    if (params.startDate || params.endDate) {
      where.transfer_date = {};
      if (params.startDate) where.transfer_date.gte = params.startDate;
      if (params.endDate) where.transfer_date.lte = params.endDate;
    }

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
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

  async getTransferById(id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        product: true,
        from_branch: true,
        to_branch: true,
        user: { select: { email: true } },
      },
    });
    if (!transfer) throw new AppError(404, 'Transfer not found');
    return transfer;
  }

  async getPendingTransfers(branchId?: string) {
    const where: Prisma.TransferWhereInput = {
      status: { in: ['PENDING', 'DISPATCHED'] },
    };
    if (branchId) {
      where.OR = [
        { from_branch_id: branchId },
        { to_branch_id: branchId },
      ];
    }
    return prisma.transfer.findMany({
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
