import type { Prisma } from '@prisma/client';

/** Product `sku` doubles as scannable barcode: exactly 9 digits, globally unique. */
export const NUMERIC_SKU_REGEX = /^\d{9}$/;

const MIN = 100_000_000;
const MAX = 999_999_999;

type ProductDb = Pick<Prisma.TransactionClient, 'product'>;

export function isNineDigitNumericSku(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  return NUMERIC_SKU_REGEX.test(String(value).trim());
}

/**
 * Value encoded on labels / Zebra: 9-digit SKU only when SKU matches rule;
 * otherwise legacy `SANITIZED-PRICE` for older products until SKU is migrated.
 */
export function encodeLabelBarcodeValue(
  sku: string | undefined | null,
  code: string | undefined | null,
  calculatedPriceInt: number
): string {
  const s = (sku || '').trim();
  if (NUMERIC_SKU_REGEX.test(s)) {
    return s;
  }
  const raw = (sku || code || 'PROD').toString();
  const sanitized = raw.replace(/[^A-Za-z0-9]/g, '') || 'PROD';
  return `${sanitized}-${Math.round(calculatedPriceInt)}`;
}

export async function generateUniqueNumericSku(db: ProductDb): Promise<string> {
  const attempts = 100;
  for (let i = 0; i < attempts; i++) {
    const candidate = String(Math.floor(Math.random() * (MAX - MIN + 1)) + MIN);
    const exists = await db.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
  }

  for (let offset = 0; offset < 1_000_000; offset++) {
    const candidate = String(MIN + ((Date.now() + offset) % (MAX - MIN + 1)));
    const exists = await db.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
  }

  throw new Error('Unable to allocate a unique 9-digit SKU after many attempts');
}
