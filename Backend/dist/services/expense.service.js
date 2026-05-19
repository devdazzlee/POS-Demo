"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const client_1 = require("../prisma/client");
class ExpenseService {
    async createExpense(data) {
        return await client_1.prisma.expense.create({ data });
    }
    async listExpenses({ page = 1, limit = 10 }) {
        const [expenses, total] = await Promise.all([
            client_1.prisma.expense.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            client_1.prisma.expense.count(),
        ]);
        return {
            data: expenses,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async create(data) {
        return client_1.prisma.employeeType.create({ data });
    }
    async getAll() {
        return client_1.prisma.employeeType.findMany();
    }
    async getById(id) {
        return client_1.prisma.employeeType.findUniqueOrThrow({ where: { id } });
    }
    async update(id, data) {
        return client_1.prisma.employeeType.update({ where: { id }, data });
    }
    async delete(id) {
        return client_1.prisma.employeeType.delete({ where: { id } });
    }
}
exports.ExpenseService = ExpenseService;
//# sourceMappingURL=expense.service.js.map