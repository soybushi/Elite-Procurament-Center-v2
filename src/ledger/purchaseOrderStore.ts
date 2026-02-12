import type { PurchaseOrder, PurchaseOrderLine } from '../types';

interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
}

const state: PurchaseOrderState = {
  purchaseOrders: [],
  purchaseOrderLines: [],
};

export const purchaseOrderStore = {
  getState(): PurchaseOrderState {
    return state;
  },
  addOrder(order: PurchaseOrder): void {
    state.purchaseOrders.push(order);
  },
  addOrders(orders: PurchaseOrder[]): void {
    state.purchaseOrders.push(...orders);
  },
  addLines(lines: PurchaseOrderLine[]): void {
    state.purchaseOrderLines.push(...lines);
  },
  reset(): void {
    state.purchaseOrders = [];
    state.purchaseOrderLines = [];
  },
};
