const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const branchStocks = await prisma.stock.groupBy({
    by: ['branch_id'],
    _count: { _all: true }
  });
  
  for (const bs of branchStocks) {
    const branch = await prisma.branch.findUnique({ where: { id: bs.branch_id } });
    console.log(`Branch: ${branch?.name} (${branch?.branch_type}) - Stocks: ${bs._count._all}`);
  }
  process.exit(0);
}

check();
