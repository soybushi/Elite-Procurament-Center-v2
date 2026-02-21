/* ------------------------------------------------------------------ */
/*  Purchase Request Service — Controlled status transitions          */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest } from '../types';
import type { Action } from '../core/security/actions';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';
import { purchaseRequestStore } from './purchaseRequestStore';
import { getPurchaseRequestById } from './purchaseRequestQueryService';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';
import { publish } from '../core/domainEventBus';

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
/**
 * Maps every writable target status to the security action that governs it.
 * All statuses that can be set via transitionPurchaseRequestStatus must appear
 * here — omitting a status would allow policy-free transitions (POLICY GAP).
 * Note: 'converted' is intentionally absent; that transition is gated by
 * PR_CONVERT_TO_PO inside purchaseRequestConversionService before this
 * function is called.
 */
const STATUS_ACTION_MAP: Partial<Record<PurchaseRequestStatus, Action>> = {
  submitted:    'PR_SUBMIT',
  under_review: 'PR_UPDATE',
  approved:     'PR_APPROVE',
  rejected:     'PR_REJECT',
};

export function transitionPurchaseRequestStatus(
  request: PurchaseRequest,
  currentCanonicalStatus: PurchaseRequestStatus,
  newStatus: PurchaseRequestStatus,
  performedByUserId: string,
): TransitionedPurchaseRequest {
  const actor = getActor();
  const action = STATUS_ACTION_MAP[newStatus];
  if (action) {
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
    version: Math.max(request.version ?? 1, 1) + 1,
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
    request.companyId || actor.companyId,
    'purchase_request',
    request.id,
    'status_changed',
    performedByUserId,
    currentCanonicalStatus,   // fromValue
    newStatus,                // toValue
  );

  auditStore.addLog(log);

  // Persist updated request in the store.
  const exists = getPurchaseRequestById(request.id);
  if (exists) {
    purchaseRequestStore.updateRequest(updated as unknown as PurchaseRequest);
  } else {
    purchaseRequestStore.addRequest(updated as unknown as PurchaseRequest);
  }

  // Emit domain event when PR reaches 'approved'.
  if (newStatus === 'approved') {
    publish({
      type: 'PR_APPROVED',
      payload: {
        purchaseRequestId: updated.id,
        companyId: actor.companyId,
        performedByUserId: actor.userId,
        occurredAt: now,
      },
    });
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

  if (updated.id !== current.id) {
    throw new Error('IMMUTABLE_FIELD:id');
  }
  if (updated.companyId !== current.companyId) {
    throw new Error('IMMUTABLE_FIELD:companyId');
  }
  if (updated.warehouseId !== current.warehouseId) {
    throw new Error('IMMUTABLE_FIELD:warehouseId');
  }

  const next: PurchaseRequest = {
    ...current,
    ...updated,
    id: current.id,
    companyId: current.companyId,
    warehouseId: current.warehouseId,
    version: Math.max(current.version ?? 1, 1) + 1,
  };

  purchaseRequestStore.updateRequest(next);

  const log = createAuditLogBase(
    current.companyId || actor.companyId,
    'purchase_request',
    current.id,
    'updated',
    actor.userId,
  );

  auditStore.addLog(log);
}
