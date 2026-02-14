/* ------------------------------------------------------------------ */
/*  Domain Events — Discriminated union of all domain-level events    */
/*  Infrastructure only; no emission yet.                             */
/* ------------------------------------------------------------------ */

export type DomainEvent =
  | { type: 'PO_CREATED'; payload: { purchaseOrderId: string } }
  | { type: 'PR_CREATED'; payload: { purchaseRequestId: string } }
  | { type: 'PR_APPROVED'; payload: { purchaseRequestId: string; companyId: string; performedByUserId: string; occurredAt: string } }
  | { type: 'TRANSFER_CREATED'; payload: { transferId: string } }
  | { type: 'LEDGER_MOVEMENT_CREATED'; payload: { movementId: string } };

export type DomainEventHandler = (event: DomainEvent) => void;
