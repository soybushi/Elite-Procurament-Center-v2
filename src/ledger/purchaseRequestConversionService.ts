/* ------------------------------------------------------------------ */
/*  Purchase Request Conversion Service                               */
/*  Converts an approved PurchaseRequest into a PurchaseOrder + lines.*/
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest, RequestItem, PurchaseOrder, PurchaseOrderLine } from '../types';
import type { TransitionedPurchaseRequest } from './purchaseRequestService';
import { createPurchaseOrderBase, createPurchaseOrderLineBase } from '../config/purchaseOrderDefaults';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';

/** Accepts both legacy and canonical request shapes. */
type ConvertibleRequest = PurchaseRequest | TransitionedPurchaseRequest;

/**
 * Converts an approved PurchaseRequest into a canonical PurchaseOrder
 * with corresponding PurchaseOrderLines.
 *
 * - Validates that the request status is 'approved'.
 * - Creates a PurchaseOrder via `createPurchaseOrderBase`.
 * - Maps each `RequestItem` to a `PurchaseOrderLine`.
 * - Records a 'converted' AuditLog entry.
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
  if ((request.status as string) !== 'approved') {
    throw new Error('Only approved requests can be converted.');
  }

  const now = new Date().toISOString();

  // Create canonical PurchaseOrder.
  const purchaseOrder = createPurchaseOrderBase(
    request.wh,        // companyId placeholder (warehouse context)
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

  // Record audit log.
  const log = createAuditLogBase(
    request.wh,
    'purchase_request',
    request.id,
    'converted',
    performedByUserId,
    'approved',           // fromValue
    'converted',          // toValue
  );

  auditStore.addLog(log);

  return { purchaseOrder, purchaseOrderLines };
}
