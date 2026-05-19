const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const stockCount = await prisma.stock.count();
  const warehouse = await prisma.branch.findFirst({ where: { branch_type: 'WAREHOUSE' } });
  const warehouseStock = warehouse ? await prisma.stock.findMany({ where: { branch_id: warehouse.id } }) : [];
  
  console.log('Total stock records:', stockCount);
  console.log('Main Warehouse ID:', warehouse?.id);
  console.log('Stock records for Main Warehouse:', warehouseStock.length);
  process.exit(0);
}

check();
