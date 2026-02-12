/* ------------------------------------------------------------------ */
/*  Baseline Loader — Seed ledger with initial inventory snapshots     */
/*  Internal tool; NOT wired into UI or production code.              */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';
import { createMovementBase } from '../config/movementDefaults';
import { DEFAULT_SYSTEM_CONFIG } from '../config/systemConfig';
import { ledgerStore } from './ledgerStore';

/**
 * Applies an inventory baseline (e.g. a migration snapshot) to the ledger
 * by creating one `adjustment` Movement per item.
 *
 * Guards:
 *  - Throws if `baselineLoaded` is already `true`.
 *  - Sets `cutoverDateISO` from the first item if still `null`.
 *  - Marks `baselineLoaded = true` after persisting movements.
 *
 * @param companyId     The company owning the inventory.
 * @param warehouseId   The warehouse to attribute the baseline to.
 * @param items         Array of SKU / qty / date tuples.
 * @param baselineTag   A short label to identify this baseline batch.
 */
export function applyInventoryBaseline(
  companyId: string,
  warehouseId: string,
  items: { sku: string; qty: number; occurredAtISO: string }[],
  baselineTag: string,
): void {
  if (DEFAULT_SYSTEM_CONFIG.baselineLoaded) {
    throw new Error('Baseline already loaded. Operation blocked.');
  }

  if (DEFAULT_SYSTEM_CONFIG.cutoverDateISO === null && items.length > 0) {
    DEFAULT_SYSTEM_CONFIG.cutoverDateISO = items[0].occurredAtISO;
  }

  const movements: Movement[] = items.map((item) => {
    const mov = createMovementBase(
      companyId,
      item.sku,
      warehouseId,
      'adjustment',
      item.qty,
      item.occurredAtISO,
    );

    mov.documentId = `MIGRATION_BASELINE_${baselineTag}`;
    mov.source = 'migration';
    mov.purchaseOrderLineId = undefined;

    return mov;
  });

  ledgerStore.addMovements(movements);

  DEFAULT_SYSTEM_CONFIG.baselineLoaded = true;
}
