/* ------------------------------------------------------------------ */
/*  Purchase Request Service — Controlled status transitions          */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest } from '../types';
import type { Action } from '../core/security/actions';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';
import { purchaseRequestStore } from './purchaseRequestStore';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/**
 * Canonical statuses for the purchase-request state machine.
 * Decoupled from the legacy PurchaseRequest['status'] union.
 */
export type PurchaseRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'converted';

/** Extended PurchaseRequest carrying canonical status and timestamps. */
export interface TransitionedPurchaseRequest
  extends Omit<PurchaseRequest, 'status'> {
  status: PurchaseRequestStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  convertedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Transition rules                                                  */
/* ------------------------------------------------------------------ */

/**
 * Allowed status transitions.
 * Key = current status → Value = set of valid target statuses.
 */
const PURCHASE_REQUEST_TRANSITIONS: Record<
  PurchaseRequestStatus,
  readonly PurchaseRequestStatus[]
> = {
  draft:        ['submitted'],
  submitted:    ['under_review', 'rejected'],
  under_review: ['approved', 'rejected', 'draft'],
  approved:     ['converted'],
  rejected:     ['draft'],
  converted:    [],
};

/**
 * Returns true when transitioning from `from` to `to` is permitted.
 */
export function canTransition(
  from: PurchaseRequestStatus,
  to: PurchaseRequestStatus,
): boolean {
  return (PURCHASE_REQUEST_TRANSITIONS[from] ?? []).includes(to);
}

/* ------------------------------------------------------------------ */
/*  Service function                                                  */
/* ------------------------------------------------------------------ */

/**
 * Transitions a PurchaseRequest to a new canonical status, validates
 * the transition, records an AuditLog entry, and returns the updated copy.
 *
 * Throws if the transition is not allowed.
 */
/** Maps target status to the security action that governs it. */
const STATUS_ACTION_MAP: Partial<Record<PurchaseRequestStatus, Action>> = {
  submitted: 'PR_SUBMIT',
  approved:  'PR_APPROVE',
  rejected:  'PR_REJECT',
};

export function transitionPurchaseRequestStatus(
  request: PurchaseRequest,
  currentCanonicalStatus: PurchaseRequestStatus,
  newStatus: PurchaseRequestStatus,
  performedByUserId: string,
): TransitionedPurchaseRequest {
  const action = STATUS_ACTION_MAP[newStatus];
  if (action) {
    const actor = getActor();
    assertCan(actor, action);
  }

  if (!canTransition(currentCanonicalStatus, newStatus)) {
    throw new Error(
      `Invalid status transition from '${currentCanonicalStatus}' to '${newStatus}'.`,
    );
  }

  const now = new Date().toISOString();

  // Build updated copy with canonical status + optional timestamps.
  const updated: TransitionedPurchaseRequest = {
    ...request,
    status: newStatus,
  };

  if (newStatus === 'submitted') {
    updated.submittedAt = now;
  }
  if (newStatus === 'approved') {
    updated.approvedAt = now;
  }
  if (newStatus === 'rejected') {
    updated.rejectedAt = now;
  }
  if (newStatus === 'converted') {
    updated.convertedAt = now;
  }

  // Record audit log.
  const log = createAuditLogBase(
    request.wh,               // companyId placeholder (wh used as context)
    'purchase_request',
    request.id,
    'status_changed',
    performedByUserId,
    currentCanonicalStatus,   // fromValue
    newStatus,                // toValue
  );

  auditStore.addLog(log);

  // Persist updated request in the store.
  const exists = purchaseRequestStore.getState().purchaseRequests.find(
    (r) => r.id === request.id,
  );
  if (exists) {
    purchaseRequestStore.updateRequest(updated as unknown as PurchaseRequest);
  } else {
    purchaseRequestStore.addRequest(updated as unknown as PurchaseRequest);
  }

  return updated;
}

/* ------------------------------------------------------------------ */
/*  Update (general field edit) — Phase 3                             */
/* ------------------------------------------------------------------ */

/**
 * Updates a PurchaseRequest's fields, persists the change, and records
 * an audit-log entry.  The caller must pass the full updated object;
 * immutable fields (id, companyId) should not be altered externally.
 */
export function updatePurchaseRequest(updated: PurchaseRequest): void {
  const actor = getActor();
  assertCan(actor, 'PR_UPDATE');

  const current = purchaseRequestStore
    .getState()
    .purchaseRequests.find((r) => r.id === updated.id);

  if (!current) {
    throw new Error('PurchaseRequest not found.');
  }

  purchaseRequestStore.updateRequest(updated);

  const log = createAuditLogBase(
    updated.wh,
    'purchase_request',
    updated.id,
    'updated',
    actor.userId,
  );

  auditStore.addLog(log);
}
