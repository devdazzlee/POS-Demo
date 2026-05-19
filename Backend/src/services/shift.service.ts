import { Shift } from '@prisma/client';
import { prisma } from '../prisma/client';
import { CreateShiftInput } from '../validations/shift.validation';

export class ShiftService {
  async createShift(data: CreateShiftInput) {
    const shift = await prisma.shift.create({
      data,
    });
    return shift;
  }

  async listShifts({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { start_time: 'asc' },
      }),
      prisma.shift.count(),
    ]);

    return {
      data: shifts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateShift(id: Shift['id'], data: Partial<CreateShiftInput>) {
    const shift = await prisma.shift.update({
      where: { id },
      data,
    });
    return shift;
  }

  async deleteShift(id: Shift['id']) {
    const shift = await prisma.shift.delete({
      where: { id },
    });
    return shift;
  }
}
