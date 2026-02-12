/* ------------------------------------------------------------------ */
/*  Purchase Request Creation Service                                 */
/*  Formal entry point for creating new PurchaseRequests.             */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest } from '../types';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';
import { purchaseRequestStore } from './purchaseRequestStore';

/**
 * Creates a new PurchaseRequest, persists it in the store,
 * and records an audit log entry.
 *
 * - Validates that the request starts in 'draft' status.
 * - Guards against duplicate ids.
 * - Persists via `purchaseRequestStore.addRequest`.
 * - Records a 'created' AuditLog entry.
 *
 * @param request  The PurchaseRequest to create (must be draft).
 * @param performedByUserId  The user performing the creation.
 * @returns The persisted PurchaseRequest.
 */
export function createPurchaseRequest(
  request: PurchaseRequest,
  performedByUserId: string,
): PurchaseRequest {
  if (request.status !== 'draft') {
    throw new Error('New PurchaseRequest must start in draft status.');
  }

  const exists = purchaseRequestStore
    .getState()
    .purchaseRequests.find((r) => r.id === request.id);

  if (exists) {
    throw new Error('PurchaseRequest with this id already exists.');
  }

  purchaseRequestStore.addRequest(request);

  const log = createAuditLogBase(
    request.wh,
    'purchase_request',
    request.id,
    'created',
    performedByUserId,
  );

  auditStore.addLog(log);

  return request;
}
