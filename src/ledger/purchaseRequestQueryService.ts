/* ------------------------------------------------------------------ */
/*  Purchase Request Query Service — Read-only gateway                */
/*  All reads outside purchaseRequestStore.ts MUST go through here.   */
/*  No mutations, no side-effects.                                    */
/* ------------------------------------------------------------------ */

import type { PurchaseRequest } from '../types';
import { usePurchaseRequestStore } from './purchaseRequestStore';

/* ------------------------------------------------------------------ */
/*  Core read functions                                               */
/* ------------------------------------------------------------------ */

/** Returns a shallow copy of every purchase request. */
export function getAllPurchaseRequests(): PurchaseRequest[] {
  return [...usePurchaseRequestStore.getState().purchaseRequests];
}

/** Returns a single purchase request by id, or undefined. */
export function getPurchaseRequestById(
  id: string,
): PurchaseRequest | undefined {
  return usePurchaseRequestStore
    .getState()
    .purchaseRequests.find((r) => r.id === id);
}

/** Returns all purchase requests matching the given status. */
export function getPurchaseRequestsByStatus(
  status: PurchaseRequest['status'],
): PurchaseRequest[] {
  return usePurchaseRequestStore
    .getState()
    .purchaseRequests.filter((r) => r.status === status);
}

/** Returns all purchase requests for a specific warehouse. */
export function getPurchaseRequestsByWarehouse(
  wh: string,
): PurchaseRequest[] {
  return usePurchaseRequestStore
    .getState()
    .purchaseRequests.filter((r) => r.wh === wh);
}
