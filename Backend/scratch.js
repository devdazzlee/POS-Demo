const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.category.findMany({ select: { code: true } }).then(console.log).finally(() => prisma.$disconnect());
