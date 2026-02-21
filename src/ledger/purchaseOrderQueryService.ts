/* ------------------------------------------------------------------ */
/*  Purchase Order Query Service — Read-only gateway                  */
/*  All reads outside purchaseOrderStore.ts MUST go through here.     */
/*  No mutations, no side-effects.                                    */
/* ------------------------------------------------------------------ */

import type { PurchaseOrder, PurchaseOrderLine } from '../types';
import { usePurchaseOrderStore } from './purchaseOrderStore';

/* ------------------------------------------------------------------ */
/*  Core read functions                                               */
/* ------------------------------------------------------------------ */

/** Returns a shallow copy of every purchase order. */
export function getAllPurchaseOrders(): PurchaseOrder[] {
  return [...usePurchaseOrderStore.getState().purchaseOrders];
}

/** Returns a single purchase order by id, or undefined. */
export function getPurchaseOrderById(
  id: string,
): PurchaseOrder | undefined {
  return usePurchaseOrderStore
    .getState()
    .purchaseOrders.find((o) => o.id === id);
}

/** Returns a single purchase order by order number, or undefined. */
export function getPurchaseOrderByOrderNumber(
  orderNumber: string,
): PurchaseOrder | undefined {
  return usePurchaseOrderStore
    .getState()
    .purchaseOrders.find((o) => o.orderNumber === orderNumber);
}

/** Returns all purchase order lines belonging to a specific order. */
export function getPurchaseOrderLinesByOrderId(
  orderId: string,
): PurchaseOrderLine[] {
  return usePurchaseOrderStore
    .getState()
    .purchaseOrderLines.filter((l) => l.purchaseOrderId === orderId);
}
