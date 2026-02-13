/* ------------------------------------------------------------------ */
/*  PR Approved Handler — Reacts to PR_APPROVED domain event          */
/*  Conversion to PO is deferred to a manual phase.                   */
/* ------------------------------------------------------------------ */

import type { DomainEvent } from '../core/domainEvents';
import { subscribe } from '../core/domainEventBus';
import { getPurchaseRequestById } from './purchaseRequestQueryService';

/* ------------------------------------------------------------------ */
/*  PR_APPROVED handler                                               */
/* ------------------------------------------------------------------ */

function handlePRApproved(event: DomainEvent): void {
  if (event.type !== 'PR_APPROVED') return;

  const { purchaseRequestId } = event.payload;

  const pr = getPurchaseRequestById(purchaseRequestId);
  if (!pr) return;

  if (pr.status !== 'approved') return;

  // No automatic conversion.
  // PR is now eligible for manual conversion only.
}

/* ------------------------------------------------------------------ */
/*  Register handler                                                  */
/* ------------------------------------------------------------------ */

subscribe(handlePRApproved);
