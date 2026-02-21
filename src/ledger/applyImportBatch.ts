/* ------------------------------------------------------------------ */
/*  Ledger — Apply an E Flower ImportResult to the in-memory ledger   */
/*  Service-level entrypoint with policy, company, and audit checks.  */
/* ------------------------------------------------------------------ */

import type { Movement, MovementType } from '../types';
import type { ImportResult, StagedMovement } from '../importers/eflower/types';
import type { ApplyBatchError, ApplyBatchResult } from './types';
import { getImportedBatches, getAllMovements } from './ledgerQueryService';
import { addMovements, setLedgerState } from './ledgerService';
import { createMovementBase } from '../config/movementDefaults';
import { resolveWarehouseId } from '../config/warehouseMaster';
import { getActor } from '../stores/authStore';
import { assertCan } from '../core/security/policyEngine';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';

function isValidISODate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function makeError(rowIndex: number, code: string, message: string): ApplyBatchError {
  return { rowIndex, code, message };
}

function convertStagedMovement(
  staged: StagedMovement,
  companyId: string,
  rowIndex: number,
): Movement | ApplyBatchError[] {
  const errors: ApplyBatchError[] = [];

  const warehouseId = resolveWarehouseId(staged.warehouseName ?? '');
  if (!warehouseId) {
    errors.push(makeError(rowIndex, 'WAREHOUSE_UNKNOWN', 'warehouseName is not in warehouse master.'));
  }

  if (typeof staged.qty !== 'number' || !Number.isFinite(staged.qty)) {
    errors.push(makeError(rowIndex, 'QTY_INVALID', 'qty is not a valid number.'));
  }

  if (!isValidISODate(staged.occurredAt)) {
    errors.push(makeError(rowIndex, 'DATE_INVALID', 'occurredAt is not a valid ISO date.'));
  }

  if (staged.type === 'transfer') {
    errors.push(makeError(rowIndex, 'TRANSFER_NO_DEST', 'Transfer movements require warehouseIdTo in staging.'));
  }

  if (errors.length > 0 || !warehouseId) return errors;

  const movement: Movement = createMovementBase(
    companyId,
    staged.sku,
    warehouseId,
    staged.type as MovementType,
    staged.qty,
    staged.occurredAt,
  );

  movement.source = 'import';

  if (staged.unitCost !== undefined && Number.isFinite(staged.unitCost)) {
    movement.unitCost = staged.unitCost;
    movement.totalCost = staged.unitCost * staged.qty;
  }

  if (staged.documentRef) {
    movement.documentId = staged.documentRef;
  }

  if (staged.externalRefs && Object.keys(staged.externalRefs).length > 0) {
    movement.externalRefs = { ...staged.externalRefs };
  }

  return movement;
}

export function applyEFlowerImportResultToLedger(
  importResult: ImportResult,
  expectedCompanyId?: string,
): ApplyBatchResult {
  const actor = getActor();
  assertCan(actor, 'DATA_IMPORT');

  if (expectedCompanyId && expectedCompanyId !== actor.companyId) {
    throw new Error('COMPANY_CONTEXT_MISMATCH');
  }

  const companyId = actor.companyId;
  const { batch, staged } = importResult;
  const batchId = batch.batchId;

  const importedBatches = getImportedBatches();
  if (importedBatches[batchId]) {
    return {
      batchId,
      rowsApplied: 0,
      rowsRejected: batch.rowsReceived,
      errors: [makeError(-1, 'DUPLICATE_BATCH', `Batch ${batchId} has already been applied.`)],
    };
  }

  const validMovements: Movement[] = [];
  const errors: ApplyBatchError[] = [];

  staged.movements.forEach((movement, index) => {
    const result = convertStagedMovement(movement, companyId, index);
    if (Array.isArray(result)) {
      errors.push(...result);
      return;
    }
    validMovements.push(result);
  });

  const rowsApplied = validMovements.length;
  const rowsRejected = staged.movements.length - rowsApplied;

  if (validMovements.length > 0) {
    addMovements(validMovements);
  }

  const currentBatches = getImportedBatches();
  currentBatches[batchId] = {
    kind: batch.kind,
    sourceFileName: batch.sourceFileName,
    receivedAt: batch.receivedAt,
    rowsApplied,
    rowsRejected,
  };

  setLedgerState({
    companyId,
    movements: getAllMovements(),
    importedBatches: currentBatches,
  });

  auditStore.addLog(
    createAuditLogBase(
      companyId,
      'data_import',
      batchId,
      'import_applied',
      actor.userId,
      undefined,
      JSON.stringify({ rowsApplied, rowsRejected, batchId }),
      {
        kind: batch.kind,
        sourceFileName: batch.sourceFileName,
      },
    ),
  );

  return { batchId, rowsApplied, rowsRejected, errors };
}
