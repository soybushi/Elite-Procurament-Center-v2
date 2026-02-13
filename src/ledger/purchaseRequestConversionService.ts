/* ------------------------------------------------------------------ */
/*  Purchase Request Conversion Service                               */
/*  Converts an approved PurchaseRequest into a PurchaseOrder + lines.*/
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest, RequestItem, PurchaseOrder, PurchaseOrderLine } from '../types';
import type { TransitionedPurchaseRequest } from './purchaseRequestService';
import { transitionPurchaseRequestStatus } from './purchaseRequestService';
import { createPurchaseOrderBase, createPurchaseOrderLineBase } from '../config/purchaseOrderDefaults';
import {
  createPurchaseOrder,
  existsPurchaseOrderByNumber,
} from './purchaseOrderService';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';
import { getPurchaseRequestById } from './purchaseRequestQueryService';
import { getPurchaseOrderByOrderNumber } from './purchaseOrderQueryService';

/** Accepts both legacy and canonical request shapes. */
type ConvertibleRequest = PurchaseRequest | TransitionedPurchaseRequest;

/**
 * Converts an approved PurchaseRequest into a canonical PurchaseOrder
 * with corresponding PurchaseOrderLines.
 *
 * - Validates that the request status is 'approved'.
 * - Creates a PurchaseOrder via `createPurchaseOrderBase`.
 * - Maps each `RequestItem` to a `PurchaseOrderLine`.
 * - Records a 'converted' audit entry via `transitionPurchaseRequestStatus`.
 *
 * @param request  The PurchaseRequest to convert (must be approved).
 * @param lines    The request items to map into PO lines.
 * @param performedByUserId  The user performing the conversion.
 */
export function convertApprovedRequestToPurchaseOrder(
  request: ConvertibleRequest,
  lines: RequestItem[],
  performedByUserId: string,
): {
  purchaseOrder: PurchaseOrder;
  purchaseOrderLines: PurchaseOrderLine[];
} {
  const actor = getActor();
  assertCan(actor, 'PR_CONVERT_TO_PO');

  if ((request.status as string) !== 'approved') {
    throw new Error('Only approved requests can be converted.');
  }

  // Guard against double conversion.
  if (existsPurchaseOrderByNumber(request.id)) {
    throw new Error('PurchaseRequest already converted to PurchaseOrder.');
  }

  const now = new Date().toISOString();

  // Create canonical PurchaseOrder.
  const purchaseOrder = createPurchaseOrderBase(
    actor.companyId,    // companyId from authenticated actor
    request.id,         // orderNumber = request id
    '',                 // supplierName — placeholder
    now,                // orderDate
  );

  // Map each RequestItem to a PurchaseOrderLine.
  const purchaseOrderLines: PurchaseOrderLine[] = lines.map((item) =>
    createPurchaseOrderLineBase(
      purchaseOrder.id,
      item.code,          // sku
      item.desc,          // nameSnapshot
      item.totalQty,      // orderedQty
      0,                  // unitPriceOrdered — placeholder
      'USD',              // currency
    ),
  );

  // Persist order and lines via the official PO service.
  createPurchaseOrder(purchaseOrder, purchaseOrderLines);

  // Transition request to 'converted' via the official state machine.
  const updatedRequest = transitionPurchaseRequestStatus(
    request as unknown as PurchaseRequest,
    'approved',
    'converted',
    performedByUserId,
  );

  return { purchaseOrder, purchaseOrderLines };
}

/* ------------------------------------------------------------------ */
/*  UI-facing conversion entry point (loads PR via query service)     */
/* ------------------------------------------------------------------ */

/** Error codes returned by convertApprovedRequestToPO. */
export type ConversionErrorCode =
  | 'PR_NOT_FOUND'
  | 'PR_NOT_APPROVED'
  | 'PR_ALREADY_CONVERTED';

export class ConversionError extends Error {
  constructor(public readonly code: ConversionErrorCode, message: string) {
    super(message);
    this.name = 'ConversionError';
  }
}

/**
 * High-level entry point for UI-driven PR → PO conversion.
 *
 * - Loads the PR via query service (read gateway).
 * - Validates status === 'approved'.
 * - Idempotent: if a PO already exists for this PR, returns it silently.
 * - Delegates to `convertApprovedRequestToPurchaseOrder` for the actual work.
 */
export function convertApprovedRequestToPO(input: {
  requestId: string;
}): { purchaseOrderId: string } {
  const pr = getPurchaseRequestById(input.requestId);
  if (!pr) {
    throw new ConversionError('PR_NOT_FOUND', `PurchaseRequest ${input.requestId} not found.`);
  }

  if ((pr.status as string) !== 'approved') {
    // Idempotent: if already converted, look up the existing PO.
    if ((pr.status as string) === 'converted') {
      const existingPO = getPurchaseOrderByOrderNumber(pr.id);
      if (existingPO) {
        return { purchaseOrderId: existingPO.id };
      }
    }
    throw new ConversionError('PR_NOT_APPROVED', `PurchaseRequest ${input.requestId} status is '${pr.status}', expected 'approved'.`);
  }

  // Idempotent: if PO already exists for this PR (guard against race / event replay).
  const existingPO = getPurchaseOrderByOrderNumber(pr.id);
  if (existingPO) {
    return { purchaseOrderId: existingPO.id };
  }

  const actor = getActor();
  const { purchaseOrder } = convertApprovedRequestToPurchaseOrder(pr, pr.items, actor.userId);
  return { purchaseOrderId: purchaseOrder.id };
}
