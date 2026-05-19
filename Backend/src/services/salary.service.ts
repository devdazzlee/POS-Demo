import { prisma } from '../prisma/client';
import { CreateSalaryInput } from '../validations/salary.validation';

export class SalaryService {
  async createSalary(data: CreateSalaryInput) {
    const salary = await prisma.salary.create({
      data,
    });
    return salary;
  }

  async listSalaries(branch_id: string, page = 1, limit = 10) {
    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where: {
          employee: {
            branch_id,
          },
        },
        include: {
          employee: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.salary.count({
        where: {
          employee: {
            branch_id,
          },
        },
      }),
    ]);

    return {
      data: salaries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateSalary(id: string, data: Partial<CreateSalaryInput>) {
    const salary = await prisma.salary.update({
      where: { id },
      data,
    });
    return salary;
  }

  async deleteSalary(id: string) {
    await prisma.salary.delete({
      where: { id },
    });
    return { message: 'Salary deleted successfully' };
  }
}
