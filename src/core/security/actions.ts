/* ------------------------------------------------------------------ */
/*  Security Actions — Canonical list of auditable operations         */
/* ------------------------------------------------------------------ */

export type Action =
  | 'PR_CREATE'
  | 'PR_UPDATE'
  | 'PR_SUBMIT'
  | 'PR_APPROVE'
  | 'PR_REJECT'
  | 'PR_CONVERT_TO_PO'
  | 'TRANSFER_CREATE'
  | 'TRANSFER_UPDATE'
  | 'LEDGER_MOVE_IN'
  | 'LEDGER_MOVE_OUT'
  | 'LEDGER_ADJUST'
  | 'PO_CREATE'
  | 'PO_EDIT'
  | 'DATA_IMPORT'
  | 'AI_READ'
  | 'AI_PROPOSE'
  | 'AI_EXECUTE';
