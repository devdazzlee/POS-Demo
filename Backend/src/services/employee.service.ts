import { prisma } from '../prisma/client';
import { AppError } from '../utils/apiError';
import { CreateEmployeeInput } from '../validations/employee.validation';

export class EmployeeService {
  async createEmployee(data: CreateEmployeeInput, branch_id: string) {
    const employee = await prisma.employee.create({
      data: { ...data, branch_id },
    });
    return employee;
  }

  async listEmployees(branch_id: string, page = 1, limit = 10) {
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { branch_id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.employee.count({ where: { branch_id } }),
    ]);

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeeInput>) {
    const employee = await prisma.employee.update({
      where: { id },
      data,
    });
    return employee;
  }

  async deleteEmployee(id: string) {
    // Hard-deleting an employee that already has shift_assignments or
    // salary records would either fail with Prisma's P2003 (which surfaces
    // as a cryptic stack trace) or — worse, if we cascaded — silently wipe
    // payroll and attendance history. Detect those dependents up front and
    // return a clear 409 telling the user to deactivate instead.
    const counts = await prisma.employee.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            shift_assignments: true,
            salaries: true,
          },
        },
      },
    });

    if (!counts) {
      throw new AppError(404, 'Employee not found');
    }

    const shifts = counts._count.shift_assignments;
    const salaries = counts._count.salaries;
    if (shifts > 0 || salaries > 0) {
      const parts: string[] = [];
      if (shifts > 0) parts.push(`${shifts} shift assignment${shifts === 1 ? '' : 's'}`);
      if (salaries > 0) parts.push(`${salaries} salary record${salaries === 1 ? '' : 's'}`);
      throw new AppError(
        409,
        `Cannot delete this employee — they still have ${parts.join(' and ')} on file. Mark them inactive instead.`,
      );
    }

    const employee = await prisma.employee.delete({ where: { id } });
    return employee;
  }
}
