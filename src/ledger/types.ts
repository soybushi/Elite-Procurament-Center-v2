/* ------------------------------------------------------------------ */
/*  Ledger Store — Types                                              */
/*  Isolated in-memory ledger; no coupling to UI or existing modules. */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';

/** Summary stored per imported batch inside ledger state. */
export interface ImportedBatchSummary {
  kind: string;
  sourceFileName: string;
  receivedAt: string;
  rowsApplied: number;
  rowsRejected: number;
}

/** Full in-memory ledger state. */
export interface LedgerState {
  companyId: string;
  movements: Movement[];
  importedBatches: Record<string, ImportedBatchSummary>;
}

/** Error detail returned after attempting to apply a batch. */
export interface ApplyBatchError {
  rowIndex: number;
  code: string;
  message: string;
}

/** Result returned from applyEFlowerImportResultToLedger. */
export interface ApplyBatchResult {
  batchId: string;
  rowsApplied: number;
  rowsRejected: number;
  errors: ApplyBatchError[];
}
