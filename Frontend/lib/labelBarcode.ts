/** Must match backend `numericBarcodeSku.ts` for label / scan consistency. */

const NUMERIC_SKU_REGEX = /^\d{9}$/;

export function encodeLabelBarcodeValue(
  sku: string | undefined | null,
  code: string | undefined | null,
  calculatedPriceInt: number
): string {
  const s = (sku || "").trim();
  if (NUMERIC_SKU_REGEX.test(s)) {
    return s;
  }
  const raw = (sku || code || "PROD").toString();
  const sanitized = raw.replace(/[^A-Za-z0-9]/g, "") || "PROD";
  return `${sanitized}-${Math.round(calculatedPriceInt)}`;
}
