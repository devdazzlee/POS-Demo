const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Test with a few known IDs from the DB
  const testIds = [
    "00a27873-b5bd-4fa2-a88f-b2df168ca208", // Harmal (Kala Dana) - is_active: true
    "0ebced99-38c5-40a6-ae1d-241bee6e8a4a", // Mixed Dana - is_active: false
    "non-existent-id"
  ];

  const products = await prisma.product.findMany({
    where: {
      id: { in: testIds },
      is_active: true,
    },
  });

  console.log("Found Active Products:", products.map(p => p.name));
  
  const foundIds = products.map(p => p.id);
  const missing = testIds.filter(id => !foundIds.includes(id));
  console.log("Missing or Inactive IDs:", missing);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
