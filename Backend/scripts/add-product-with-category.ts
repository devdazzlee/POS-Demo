import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

interface ProductData {
    name: string;
    category_name: string;
    purchase_rate?: number;
    sales_rate_exc_dis_and_tax?: number;
    sales_rate_inc_dis_and_tax?: number;
    sku?: string;
    description?: string;
    min_qty?: number;
    max_qty?: number;
    unit_name?: string;
    subcategory_name?: string;
    tax_name?: string;
    supplier_name?: string;
    brand_name?: string;
    color_name?: string;
    size_name?: string;
}

async function addProductWithCategory(productData: ProductData) {
    try {
        const productService = new ProductService();
        
        // Use the bulk upload method which handles category names
        const product = await productService.createProductFromBulkUpload({
            name: productData.name,
            category_name: productData.category_name,
            purchase_rate: productData.purchase_rate || 0,
            sales_rate_exc_dis_and_tax: productData.sales_rate_exc_dis_and_tax || productData.purchase_rate || 0,
            sales_rate_inc_dis_and_tax: productData.sales_rate_inc_dis_and_tax || productData.purchase_rate || 0,
            sku: productData.sku,
            description: productData.description,
            min_qty: productData.min_qty || 10,
            max_qty: productData.max_qty || 10,
            unit_name: productData.unit_name,
            subcategory_name: productData.subcategory_name,
            tax_name: productData.tax_name,
            supplier_name: productData.supplier_name,
            brand_name: productData.brand_name,
            color_name: productData.color_name,
            size_name: productData.size_name,
        });
        
        console.log(`✅ Product created: ${product.name} (ID: ${product.id})`);
        console.log(`   Category: ${product.category?.name || 'Unknown'}`);
        return product;
    } catch (error) {
        console.error(`❌ Error creating product "${productData.name}":`, (error as Error).message);
        throw error;
    }
}

// Example usage - you can call this function with product data
// addProductWithCategory({
//     name: "Example Product",
//     category_name: "Spices",
//     purchase_rate: 100,
//     sales_rate_exc_dis_and_tax: 150,
//     sales_rate_inc_dis_and_tax: 150
// }).then(() => prisma.$disconnect());

export { addProductWithCategory, ProductData };

