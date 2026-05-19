const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { updated_at: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      is_active: true,
      updated_at: true
    }
  });
  console.log("Recently Updated Products:");
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
