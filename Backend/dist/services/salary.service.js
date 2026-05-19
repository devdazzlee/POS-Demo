"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryService = void 0;
const client_1 = require("../prisma/client");
class SalaryService {
    async createSalary(data) {
        const salary = await client_1.prisma.salary.create({
            data,
        });
        return salary;
    }
    async listSalaries(branch_id, page = 1, limit = 10) {
        const [salaries, total] = await Promise.all([
            client_1.prisma.salary.findMany({
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
            client_1.prisma.salary.count({
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
    async updateSalary(id, data) {
        const salary = await client_1.prisma.salary.update({
            where: { id },
            data,
        });
        return salary;
    }
    async deleteSalary(id) {
        await client_1.prisma.salary.delete({
            where: { id },
        });
        return { message: 'Salary deleted successfully' };
    }
}
exports.SalaryService = SalaryService;
//# sourceMappingURL=salary.service.js.map