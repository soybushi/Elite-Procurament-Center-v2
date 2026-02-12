/* ------------------------------------------------------------------ */
/*  Purchase Request Service — Controlled status transitions          */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest } from '../types';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';
import { purchaseRequestStore } from './purchaseRequestStore';

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
export function transitionPurchaseRequestStatus(
  request: PurchaseRequest,
  currentCanonicalStatus: PurchaseRequestStatus,
  newStatus: PurchaseRequestStatus,
  performedByUserId: string,
): TransitionedPurchaseRequest {
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
