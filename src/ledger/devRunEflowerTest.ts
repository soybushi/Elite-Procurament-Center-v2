/* ------------------------------------------------------------------ */
/*  Dev Runner — E Flower REF_HISTORIAL_COMPRAS end-to-end test       */
/*  Internal tool; NOT wired into UI or production code.              */
/* ------------------------------------------------------------------ */

import { DEFAULT_COMPANY } from '../config/defaultCompany';
import { mapEFlowerRowsToStaging } from '../importers/eflower/eflowerMapper';
import { applyEFlowerImportResultToLedger } from './applyImportBatch';
import type { ApplyBatchResult } from './types';

/**
 * Runs a full import pipeline for REF_HISTORIAL_COMPRAS rows:
 *
 *  1. Maps raw rows → staging (ImportResult)
 *  2. Applies staging → canonical ledger (ApplyBatchResult)
 *  3. Logs a summary to the console.
 *
 * Uses `DEFAULT_COMPANY.id` as companyId.
 * Returns the `ApplyBatchResult` for programmatic inspection.
 */
export async function runEflowerHistorialTest(
  rows: Record<string, unknown>[],
  sourceFileName: string,
): Promise<ApplyBatchResult> {
  const companyId = DEFAULT_COMPANY.id;

  // Step 1 — Map raw rows to staging
  const importResult = mapEFlowerRowsToStaging(
    companyId,
    'REF_HISTORIAL_COMPRAS',
    rows,
    sourceFileName,
  );

  const { batch, staged } = importResult;

  // Step 2 — Apply staging to ledger
  const applyResult = applyEFlowerImportResultToLedger(importResult, companyId);

  // Step 3 — Log summary
  console.log('─── E Flower REF_HISTORIAL_COMPRAS Test ───');
  console.log(`  Source file : ${sourceFileName}`);
  console.log(`  Batch ID   : ${batch.batchId}`);
  console.log(`  Rows received : ${batch.rowsReceived}`);
  console.log(`  Rows valid    : ${batch.rowsValid}`);
  console.log(`  Rows rejected : ${batch.rowsRejected}`);
  console.log(`  Staged movements : ${staged.movements.length}`);
  console.log(`  Rows applied  : ${applyResult.rowsApplied}`);
  console.log(`  Rows rejected (ledger): ${applyResult.rowsRejected}`);

  if (applyResult.errors.length > 0) {
    console.log(`  Errors (${applyResult.errors.length}):`);
    for (const e of applyResult.errors) {
      console.log(`    [row ${e.rowIndex}] ${e.code}: ${e.message}`);
    }
  } else {
    console.log('  Errors: none');
  }

  console.log('───────────────────────────────────────────');

  return applyResult;
}
