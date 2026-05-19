import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function exportDatabase() {
  console.log('📤 Exporting database...\n');
  
  const exportData: any = {
    exportedAt: new Date().toISOString(),
    products: await prisma.product.findMany(),
    categories: await prisma.category.findMany(),
    productImages: await prisma.productImage.findMany(),
  };
  
  const exportPath = path.resolve(__dirname, '../database-export-' + Date.now() + '.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  
  console.log('✅ Exported to:', exportPath);
  await prisma.$disconnect();
}

exportDatabase().catch(console.error);
