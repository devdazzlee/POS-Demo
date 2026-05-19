import { z } from 'zod';

const productSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  code: z.string().optional(),
  sales_rate_exc_dis_and_tax: z.number().optional(),
  netWeight: z.string().min(1, 'Net weight is required'),
  packageDate: z.string().min(1, 'Package date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

const printSettingsSchema = z.object({
  paperSize: z.string().optional(),
  copies: z.number().min(1).max(10).optional(),
});

export const printBarcodesSchema = z.object({
  body: z.object({
    products: z.array(productSchema).min(1, 'At least one product is required'),
    printerName: z.string().min(1, 'Printer name is required'),
    settings: printSettingsSchema.optional(),
  })
});

export const testPrinterSchema = z.object({
  body: z.object({
    printerName: z.string().min(1, 'Printer name is required'),
  })
});
