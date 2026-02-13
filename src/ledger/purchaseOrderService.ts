import type { PurchaseOrder, PurchaseOrderLine } from '../types';
import { purchaseOrderStore } from './purchaseOrderStore';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';

export function createPurchaseOrder(
  order: PurchaseOrder,
  lines: PurchaseOrderLine[]
): void {
  const actor = getActor();
  assertCan(actor, 'PO_CREATE');

  purchaseOrderStore.addOrder(order);
  purchaseOrderStore.addLines(lines);
}
