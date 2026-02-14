/* ------------------------------------------------------------------ */
/*  Ledger Query Service — Read-only gateway for ledger state         */
/*  All reads outside ledgerStore.ts MUST go through this service.    */
/*  No mutations, no side-effects.                                    */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';
import type { ImportedBatchSummary } from './types';
import { useLedgerStore } from './ledgerStore';

/* ------------------------------------------------------------------ */
/*  Core read functions                                               */
/* ------------------------------------------------------------------ */

/** Returns a shallow copy of every movement in the ledger. */
export function getAllMovements(): Movement[] {
  return [...useLedgerStore.getState().movements];
}

/** Returns all movements matching the given SKU. */
export function getMovementsBySku(sku: string): Movement[] {
  return useLedgerStore.getState().movements.filter((m) => m.sku === sku);
}

/**
 * Returns a map of warehouseId → total movement count.
 * Both origin and destination warehouses are counted.
 */
export function getWarehouseTotals(): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const m of useLedgerStore.getState().movements) {
    totals[m.warehouseId] = (totals[m.warehouseId] ?? 0) + 1;
    if (m.warehouseIdTo) {
      totals[m.warehouseIdTo] = (totals[m.warehouseIdTo] ?? 0) + 1;
    }
  }
  return totals;
}

/** Returns all movements linked to a specific document ID. */
export function getMovementsByDocument(documentId: string): Movement[] {
  return useLedgerStore
    .getState()
    .movements.filter((m) => m.documentId === documentId);
}

/* ------------------------------------------------------------------ */
/*  Extended read functions (used by domain services)                  */
/* ------------------------------------------------------------------ */

/** Returns the imported-batches registry (shallow copy). */
export function getImportedBatches(): Record<string, ImportedBatchSummary> {
  return { ...useLedgerStore.getState().importedBatches };
}

/** Returns the current companyId stored in the ledger. */
export function getCompanyId(): string {
  return useLedgerStore.getState().companyId;
}
