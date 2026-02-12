import type { PurchaseRequest } from '../types';

interface PurchaseRequestState {
  purchaseRequests: PurchaseRequest[];
}

const state: PurchaseRequestState = {
  purchaseRequests: [],
};

export const purchaseRequestStore = {
  getState(): PurchaseRequestState {
    return state;
  },
  addRequest(request: PurchaseRequest): void {
    state.purchaseRequests.push(request);
  },
  updateRequest(updated: PurchaseRequest): void {
    const index = state.purchaseRequests.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      state.purchaseRequests[index] = updated;
    }
  },
  reset(): void {
    state.purchaseRequests = [];
  },
};
