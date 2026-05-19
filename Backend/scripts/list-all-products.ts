import { prisma } from '../src/prisma/client';
import fs from 'fs';
import path from 'path';

async function listAllProducts() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Fetch ALL products with related data
    const allProducts = await prisma.product.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        category: {
          select: { id: true, name: true }
        },
        subcategory: {
          select: { id: true, name: true }
        },
        unit: {
          select: { id: true, name: true }
        },
        brand: {
          select: { id: true, name: true }
        },
        supplier: {
          select: { id: true, name: true }
        },
        tax: {
          select: { id: true, name: true, percentage: true }
        },
        color: {
          select: { id: true, name: true }
        },
        size: {
          select: { id: true, name: true }
        }
      }
    });

    const totalCount = allProducts.length;

    console.log('📊 FETCHING ALL PRODUCTS...');
    console.log(`Total Products Found: ${totalCount}\n`);

    // Prepare data for export
    const productsData = allProducts.map((product, index) => ({
      index: index + 1,
      id: product.id,
      code: product.code,
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      purchase_rate: product.purchase_rate.toString(),
      sales_rate_exc_dis_and_tax: product.sales_rate_exc_dis_and_tax.toString(),
      sales_rate_inc_dis_and_tax: product.sales_rate_inc_dis_and_tax.toString(),
      discount_amount: product.discount_amount?.toString() || '0',
      min_qty: product.min_qty || 0,
      max_qty: product.max_qty || 0,
      category: product.category?.name || 'Unknown',
      subcategory: product.subcategory?.name || 'N/A',
      unit: product.unit?.name || 'Unknown',
      brand: product.brand?.name || 'N/A',
      supplier: product.supplier?.name || 'N/A',
      tax: product.tax ? `${product.tax.name} (${product.tax.percentage}%)` : 'N/A',
      color: product.color?.name || 'N/A',
      size: product.size?.name || 'N/A',
      is_active: product.is_active,
      display_on_pos: product.display_on_pos,
      is_featured: product.is_featured,
      is_batch: product.is_batch,
      is_deal: product.is_deal,
      has_images: product.has_images,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString()
    }));

    // Save to JSON file
    const outputPath = path.join(__dirname, '../../all-products-complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(productsData, null, 2), 'utf-8');

    // Display summary
    console.log('='.repeat(80));
    console.log('📦 COMPLETE PRODUCT LIST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Products:        ${totalCount}`);
    console.log(`Active Products:        ${allProducts.filter(p => p.is_active).length}`);
    console.log(`Inactive Products:      ${allProducts.filter(p => !p.is_active).length}`);
    console.log(`POS Display Products:   ${allProducts.filter(p => p.display_on_pos).length}`);
    console.log(`Featured Products:      ${allProducts.filter(p => p.is_featured).length}`);
    console.log(`Products with Images:   ${allProducts.filter(p => p.has_images).length}`);
    console.log(`Batch Products:         ${allProducts.filter(p => p.is_batch).length}`);
    console.log(`Deal Products:          ${allProducts.filter(p => p.is_deal).length}`);
    console.log('='.repeat(80));

    // Display first 20 products as preview
    console.log('\n📋 FIRST 20 PRODUCTS (Preview):');
    console.log('-'.repeat(80));
    productsData.slice(0, 20).forEach((product) => {
      console.log(`${product.index}. [${product.code}] ${product.name} | SKU: ${product.sku} | Category: ${product.category}`);
    });

    if (totalCount > 20) {
      console.log(`\n... and ${totalCount - 20} more products`);
    }

    console.log(`\n✅ Complete product list saved to: ${outputPath}`);
    console.log(`📄 File contains ${totalCount} products with full details\n`);

    // Disconnect
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

listAllProducts();











