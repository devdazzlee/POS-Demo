const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inactiveProducts = await prisma.product.findMany({
    where: { is_active: false },
    select: {
      id: true,
      name: true
    }
  });
  console.log("Inactive Products:");
  console.log(JSON.stringify(inactiveProducts, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
