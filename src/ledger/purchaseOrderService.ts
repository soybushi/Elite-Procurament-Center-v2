import type { PurchaseOrder, PurchaseOrderLine } from '../types';
import { purchaseOrderStore } from './purchaseOrderStore';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';
import { getPurchaseOrderByOrderNumber } from './purchaseOrderQueryService';
import { publish } from '../core/domainEventBus';

export function createPurchaseOrder(
  order: PurchaseOrder,
  lines: PurchaseOrderLine[]
): void {
  const actor = getActor();
  assertCan(actor, 'PO_CREATE');

  purchaseOrderStore.addOrder(order);
  purchaseOrderStore.addLines(lines);

  publish({ type: 'PO_CREATED', payload: { purchaseOrderId: order.id } });
}

export function existsPurchaseOrderByNumber(orderNumber: string): boolean {
  return getPurchaseOrderByOrderNumber(orderNumber) !== undefined;
}
