/* ------------------------------------------------------------------ */
/*  Purchase Request Conversion Service                               */
/*  Converts an approved PurchaseRequest into a PurchaseOrder + lines.*/
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest, RequestItem, PurchaseOrder, PurchaseOrderLine } from '../types';
import type { TransitionedPurchaseRequest } from './purchaseRequestService';
import { transitionPurchaseRequestStatus } from './purchaseRequestService';
import { createPurchaseOrderBase, createPurchaseOrderLineBase } from '../config/purchaseOrderDefaults';
import { purchaseOrderStore } from './purchaseOrderStore';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';

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
  const existing = purchaseOrderStore.getState().purchaseOrders.find(
    (order) => order.orderNumber === request.id,
  );
  if (existing) {
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

  // Persist order and lines in the PO store.
  purchaseOrderStore.addOrder(purchaseOrder);
  purchaseOrderStore.addLines(purchaseOrderLines);

  // Transition request to 'converted' via the official state machine.
  const updatedRequest = transitionPurchaseRequestStatus(
    request as unknown as PurchaseRequest,
    'approved',
    'converted',
    performedByUserId,
  );

  return { purchaseOrder, purchaseOrderLines };
}
