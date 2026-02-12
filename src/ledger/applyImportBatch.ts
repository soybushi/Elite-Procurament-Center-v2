/* ------------------------------------------------------------------ */
/*  Ledger — Apply an E Flower ImportResult to the in-memory ledger   */
/*  No UI, no side-effects beyond updating ledgerStore.               */
/* ------------------------------------------------------------------ */

import type { Movement, MovementType } from '../types';
import type { ImportResult, StagedMovement } from '../importers/eflower/types';
import type { ApplyBatchError, ApplyBatchResult } from './types';
import { ledgerStore } from './ledgerStore';
import { createMovementBase } from '../config/movementDefaults';
import { normalizeWarehouseName } from '../config/warehouseMaster';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

/** Returns true when the string can be parsed as a valid Date. */
function isValidISODate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function makeError(rowIndex: number, code: string, message: string): ApplyBatchError {
  return { rowIndex, code, message };
}

/**
 * Attempt to convert a StagedMovement into a canonical Movement.
 * Returns the Movement on success, or an array of errors on failure.
 */
function convertStagedMovement(
  staged: StagedMovement,
  companyId: string,
  rowIndex: number,
): Movement | ApplyBatchError[] {
  const errors: ApplyBatchError[] = [];

  // --- warehouseName ---
  const normalizedWh = normalizeWarehouseName(staged.warehouseName ?? '');
  if (!normalizedWh) {
    errors.push(makeError(rowIndex, 'WAREHOUSE_EMPTY', 'warehouseName is empty after normalisation.'));
  }

  // --- qty ---
  if (typeof staged.qty !== 'number' || !Number.isFinite(staged.qty)) {
    errors.push(makeError(rowIndex, 'QTY_INVALID', 'qty is not a valid number.'));
  }

  // --- occurredAt ---
  if (!isValidISODate(staged.occurredAt)) {
    errors.push(makeError(rowIndex, 'DATE_INVALID', 'occurredAt is not a valid ISO date.'));
  }

  // --- transfer must have warehouseIdTo ---
  if (staged.type === 'transfer') {
    // StagedMovement doesn't carry warehouseIdTo — reject transfers without it.
    errors.push(makeError(rowIndex, 'TRANSFER_NO_DEST', 'Transfer movements require a destination warehouse (warehouseIdTo) which is absent in staging.'));
  }

  if (errors.length > 0) return errors;

  // --- Build canonical Movement via createMovementBase ---
  const mov: Movement = createMovementBase(
    companyId,
    staged.sku,
    normalizedWh,               // warehouseId = normalized name for now
    staged.type as MovementType,
    staged.qty,
    staged.occurredAt,
  );

  // Override source to 'import' since this comes from the importer pipeline.
  (mov as { source: string }).source = 'import';

  // Carry over optional cost fields.
  if (staged.unitCost !== undefined && Number.isFinite(staged.unitCost)) {
    mov.unitCost = staged.unitCost;
    mov.totalCost = staged.unitCost * staged.qty;
  }

  // Carry over documentRef → documentId.
  if (staged.documentRef) {
    mov.documentId = staged.documentRef;
  }

  // Carry over externalRefs (shallow copy — raw is NOT copied).
  if (staged.externalRefs && Object.keys(staged.externalRefs).length > 0) {
    mov.externalRefs = { ...staged.externalRefs };
  }

  return mov;
}

/* ------------------------------------------------------------------ */
/*  Public entry point                                                */
/* ------------------------------------------------------------------ */

/**
 * Applies a fully validated `ImportResult` (from the E Flower importer)
 * to the in-memory `ledgerStore`.
 *
 * - Detects duplicate batches by `batchId`.
 * - Converts each `StagedMovement` → canonical `Movement`.
 * - Rejects rows that fail validation (qty, date, warehouse, transfer dest).
 * - Registers the batch summary in `ledgerStore.importedBatches`.
 */
export function applyEFlowerImportResultToLedger(
  importResult: ImportResult,
  companyId: string,
): ApplyBatchResult {
  const { batch, staged } = importResult;
  const batchId = batch.batchId;

  // ---- Duplicate batch guard ----
  const state = ledgerStore.getState();
  if (state.importedBatches[batchId]) {
    return {
      batchId,
      rowsApplied: 0,
      rowsRejected: batch.rowsReceived,
      errors: [makeError(-1, 'DUPLICATE_BATCH', `Batch ${batchId} has already been applied.`)],
    };
  }

  // ---- Convert staged movements ----
  const validMovements: Movement[] = [];
  const errors: ApplyBatchError[] = [];

  staged.movements.forEach((sm, idx) => {
    const result = convertStagedMovement(sm, companyId, idx);
    if (Array.isArray(result)) {
      errors.push(...result);
    } else {
      validMovements.push(result);
    }
  });

  const rowsApplied = validMovements.length;
  const rowsRejected = staged.movements.length - rowsApplied;

  // ---- Persist to store ----
  if (validMovements.length > 0) {
    ledgerStore.addMovements(validMovements);
  }

  // Register batch summary (mutate internal state directly for atomicity).
  const currentState = ledgerStore.getState();
  currentState.importedBatches[batchId] = {
    kind: batch.kind,
    sourceFileName: batch.sourceFileName,
    receivedAt: batch.receivedAt,
    rowsApplied,
    rowsRejected,
  };
  ledgerStore.setState(currentState);

  return { batchId, rowsApplied, rowsRejected, errors };
}
