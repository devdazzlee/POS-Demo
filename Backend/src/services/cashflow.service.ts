import { prisma } from '../prisma/client';

export class CashFlowService {
  async getCashFlowByDate(branch_id: string, date: string) {
    console.log('getCashFlowByDate - received params:', { branch_id, date }); // Debug log

    // Parse the date string properly (YYYY-MM-DD format)
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    console.log('getCashFlowByDate - searching by date:', { 
      branch_id, 
      date, 
      year, month, day,
      startOfDay: startOfDay.toISOString(), 
      endOfDay: endOfDay.toISOString() 
    }); // Debug log

    // First, let's check what cashflows exist for this branch
    const allCashFlowsForBranch = await prisma.cashFlow.findMany({
      where: { branch_id },
      select: { 
        id: true, 
        opened_at: true, 
        status: true,
        created_at: true 
      },
      orderBy: { opened_at: 'desc' },
      take: 10,
    });
    console.log('All cashflows for this branch:', allCashFlowsForBranch); // Debug log

    // Find cashflow for the specific date (not just any open drawer)
    const cashFlow = await prisma.cashFlow.findFirst({
      where: {
        branch_id,
        opened_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { expenses: true },
    });

    console.log('getCashFlowByDate - found by date:', cashFlow); // Debug log

    if (!cashFlow) {
      console.log('getCashFlowByDate - no cashflow found, returning exists: false'); // Debug log
      return { exists: false, data: null };
    }

    console.log('getCashFlowByDate - cashflow found, returning exists: true'); // Debug log
    return { exists: true, data: cashFlow };
  }

  async createOpeningCashFlow(data: { opening: number; sales: number; branch_id: string }) {
    const cashFlow = await prisma.cashFlow.create({
      data: {
        opening: data.opening,
        sales: data.sales,
        closing: null,
        branch_id: data.branch_id,
        status: 'OPEN',
        opened_at: new Date(),
      },
    });

    return cashFlow;
  }

  async addExpense(data: {
    cashflow_id: string;
    particular: string;
    amount: number;
  }) {
    const expense = await prisma.expense.create({
      data: {
        particular: data.particular,
        amount: data.amount,
        cashflow_id: data.cashflow_id,
      },
    });

    return expense;
  }

  async addClosing(cashflow_id: string, closing: number) {
    const updated = await prisma.cashFlow.update({
      where: { id: cashflow_id },
      data: { 
        closing,
        status: 'CLOSED',
        closed_at: new Date()
      },
    });

    return updated;
  }

  async listCashFlows({
    page = 1,
    limit = 10,
    branch_id,
  }: {
    page?: number;
    limit?: number;
    branch_id?: string;
  }) {
    const whereClause = branch_id ? { branch_id } : {};
    
    const [cashFlows, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { expenses: true },
      }),
      prisma.cashFlow.count({ where: whereClause }),
    ]);

    return {
      data: cashFlows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOpenDrawer(branch_id: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('findOpenDrawer - searching for:', { branch_id, startOfDay, endOfDay }); // Debug log
    
    const result = await prisma.cashFlow.findFirst({
      where: {
        branch_id,
        status: 'OPEN',
        opened_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    console.log('findOpenDrawer - found:', result); // Debug log
    return result;
  }

  async findAnyDrawerToday(branch_id: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log('findAnyDrawerToday - searching for:', { 
      branch_id, 
      startOfDay: startOfDay.toISOString(), 
      endOfDay: endOfDay.toISOString() 
    }); // Debug log
    
    const result = await prisma.cashFlow.findFirst({
      where: {
        branch_id,
        opened_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    console.log('findAnyDrawerToday - found:', result); // Debug log
    return result;
  }

  async getExpensesByDate(branch_id: string, date?: string) {
    console.log('getExpensesByDate - received params:', { branch_id, date }); // Debug log
    
    // First, try to find the currently open drawer for this branch
    let cashFlow = await prisma.cashFlow.findFirst({
      where: {
        branch_id,
        status: 'OPEN',
      },
      include: { expenses: true },
    });

    if (cashFlow) {
      console.log('getExpensesByDate - found open drawer with expenses:', cashFlow.expenses?.length || 0); // Debug log
      return cashFlow.expenses || [];
    }

    // If no open drawer, try to find by date
    let startOfDay, endOfDay;
    
    if (date) {
      // Parse the date string properly (YYYY-MM-DD format)
      const [year, month, day] = date.split('-').map(Number);
      startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
      endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      // Use today's date
      const today = new Date();
      startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    }
    
    console.log('getExpensesByDate - searching by date:', { 
      branch_id, 
      date, 
      startOfDay: startOfDay.toISOString(), 
      endOfDay: endOfDay.toISOString() 
    }); // Debug log
    
    cashFlow = await prisma.cashFlow.findFirst({
      where: {
        branch_id,
        opened_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { expenses: true },
    });
    
    console.log('getExpensesByDate - found by date with expenses:', cashFlow?.expenses?.length || 0); // Debug log
    return cashFlow?.expenses || [];
  }
}
