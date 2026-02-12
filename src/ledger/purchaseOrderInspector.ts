/* ------------------------------------------------------------------ */
/*  Purchase Order Inspector — Pure analytical queries                 */
/*  Read-only over ledgerStore; no mutations, no external deps.       */
/* ------------------------------------------------------------------ */

import type { PurchaseOrderLine, PurchaseOrderLineStatus } from '../types';
import { ledgerStore } from './ledgerStore';

/**
 * Computes the net received quantity for a specific PurchaseOrderLine
 * by replaying all movements linked via `purchaseOrderLineId`.
 *
 *  receipt    → +qty
 *  issue      → −qty
 *  adjustment → +qty (sign preserved)
 *  transfer   → ignored (does not affect reception)
 */
export function getReceivedQtyForLine(purchaseOrderLineId: string): number {
  const { movements } = ledgerStore.getState();
  let total = 0;

  for (const m of movements) {
    if (m.purchaseOrderLineId !== purchaseOrderLineId) continue;

    switch (m.type) {
      case 'receipt':
        total += m.qty;
        break;
      case 'issue':
        total -= m.qty;
        break;
      case 'adjustment':
        total += m.qty;
        break;
      case 'transfer':
        // Transfers do not count towards PO line reception.
        break;
    }
  }

  return total;
}

/**
 * Derives the status of a PurchaseOrderLine based on how much
 * has been received against the ordered quantity.
 *
 *  receivedQty === 0                → 'open'
 *  0 < receivedQty < orderedQty     → 'partial'
 *  receivedQty >= orderedQty        → 'fulfilled'
 */
export function getPurchaseOrderLineStatus(
  line: PurchaseOrderLine,
): PurchaseOrderLineStatus {
  const receivedQty = getReceivedQtyForLine(line.id);

  if (receivedQty <= 0) return 'open';
  if (receivedQty < line.orderedQty) return 'partial';
  return 'fulfilled';
}
