/* ------------------------------------------------------------------ */
/*  Purchase Order Defaults — Pure factory functions                   */
/*  No side-effects, no external dependencies.                        */
/* ------------------------------------------------------------------ */

import type { PurchaseOrder, PurchaseOrderLine } from '../types';

/** Generate a simple unique id without external libraries. */
function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

/**
 * Creates a minimal valid PurchaseOrder with status 'open'.
 */
export function createPurchaseOrderBase(
  companyId: string,
  orderNumber: string,
  supplierName: string,
  orderDate: string,
): PurchaseOrder {
  return {
    id: generateId('PO'),
    companyId,
    orderNumber,
    supplierName,
    orderDate,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates a minimal valid PurchaseOrderLine with status 'open'.
 */
export function createPurchaseOrderLineBase(
  purchaseOrderId: string,
  sku: string,
  name: string,
  orderedQty: number,
  unitPrice: number,
  currency: string,
): PurchaseOrderLine {
  return {
    id: generateId('POL'),
    purchaseOrderId,
    sku,
    nameSnapshot: name,
    orderedQty,
    unitPriceOrdered: unitPrice,
    currency,
    status: 'open',
  };
}
