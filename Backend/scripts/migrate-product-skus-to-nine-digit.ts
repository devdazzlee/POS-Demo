/**
 * One-off migration: assign a unique 9-digit numeric SKU to every product
 * whose current SKU is not already exactly 9 digits.
 *
 * Safe for the database:
 * - No deletes
 * - Only updates Product.sku (relations use product_id UUID, not SKU)
 *
 * Usage (from Backend folder):
 *   yarn migrate:skus-nine-digit --dry-run    # log only, no DB writes
 *   yarn migrate:skus-nine-digit             # apply updates
 *
 * Optional: writes a JSON mapping file under scripts/ for your records.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

import { prisma } from '../src/prisma/client';
import { isNineDigitNumericSku } from '../src/utils/numericBarcodeSku';

const MIN = 100_000_000;
const MAX = 999_999_999;

function randomNineDigit(): string {
  return String(Math.floor(Math.random() * (MAX - MIN + 1)) + MIN);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const all = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, code: true },
    orderBy: { created_at: 'asc' },
  });

  /** All SKUs that must stay reserved (already valid 9-digit, or assigned in this run). */
  const reserved = new Set<string>();
  for (const p of all) {
    if (isNineDigitNumericSku(p.sku)) {
      reserved.add(String(p.sku).trim());
    }
  }

  const toMigrate = all.filter((p) => !isNineDigitNumericSku(p.sku));
  const alreadyOk = all.length - toMigrate.length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total products:     ${all.length}`);
  console.log(`Already 9-digit:    ${alreadyOk}`);
  console.log(`To migrate:         ${toMigrate.length}`);
  console.log(`Mode:               ${dryRun ? 'DRY RUN (no writes)' : 'APPLY UPDATES'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const mapping: Array<{
    id: string;
    code: string;
    name: string;
    oldSku: string;
    newSku: string;
  }> = [];

  for (const p of toMigrate) {
    let candidate: string;
    let guard = 0;
    do {
      candidate = randomNineDigit();
      guard += 1;
      if (guard > 50_000) {
        throw new Error('Could not allocate unique 9-digit SKU after many attempts');
      }
    } while (reserved.has(candidate));
    reserved.add(candidate);

    mapping.push({
      id: p.id,
      code: p.code,
      name: p.name,
      oldSku: p.sku,
      newSku: candidate,
    });
  }

  const mapPath = path.join(
    __dirname,
    `sku-migration-mapping-${Date.now()}.json`
  );
  fs.writeFileSync(mapPath, JSON.stringify({ generatedAt: new Date().toISOString(), dryRun, mapping }, null, 2));
  console.log(`Mapping file written: ${mapPath}`);

  if (dryRun) {
    console.log('\nFirst 15 planned changes:');
    mapping.slice(0, 15).forEach((m) => {
      console.log(`  ${m.code} | ${m.name.slice(0, 40)} | ${m.oldSku} -> ${m.newSku}`);
    });
    await prisma.$disconnect();
    return;
  }

  const BATCH = 50;
  for (let i = 0; i < mapping.length; i += BATCH) {
    const slice = mapping.slice(i, i + BATCH);
    await prisma.$transaction(
      slice.map((m) =>
        prisma.product.update({
          where: { id: m.id },
          data: { sku: m.newSku },
        })
      )
    );
    console.log(`Updated ${Math.min(i + BATCH, mapping.length)} / ${mapping.length}`);
  }

  console.log('\nDone. Re-print physical labels for migrated products; old barcodes will no longer match SKU.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
