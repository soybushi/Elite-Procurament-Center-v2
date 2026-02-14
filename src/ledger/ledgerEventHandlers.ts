/* ------------------------------------------------------------------ */
/*  Ledger Event Handlers — React to domain events                    */
/*  Subscribes to the domainEventBus and creates ledger movements.    */
/* ------------------------------------------------------------------ */

import type { DomainEvent } from '../core/domainEvents';
import { subscribe } from '../core/domainEventBus';
import { getPurchaseOrderById } from './purchaseOrderQueryService';
import { getPurchaseOrderLinesByOrderId } from './purchaseOrderQueryService';
import { moveIn } from './ledgerService';

/* ------------------------------------------------------------------ */
/*  PO_CREATED → receipt movements per PO line                        */
/* ------------------------------------------------------------------ */

function handlePOCreated(event: DomainEvent): void {
  if (event.type !== 'PO_CREATED') return;

  const { purchaseOrderId } = event.payload;
  const po = getPurchaseOrderById(purchaseOrderId);
  if (!po) return;

  const lines = getPurchaseOrderLinesByOrderId(po.id);

  for (const line of lines) {
    moveIn({
      sku: line.sku,
      warehouseId: po.companyId,
      qty: line.orderedQty,
      occurredAtISO: po.orderDate,
      documentId: po.id,
      note: `Auto receipt for PO ${po.orderNumber}, line ${line.id}`,
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Register all handlers                                             */
/* ------------------------------------------------------------------ */

subscribe(handlePOCreated);
