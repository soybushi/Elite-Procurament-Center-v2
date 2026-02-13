import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PurchaseRequest } from '../types';

/* ------------------------------------------------------------------ */
/*  Zustand-based reactive store for PurchaseRequests                 */
/*  Persisted to localStorage under key "ef-reqs" (legacy compat).    */
/* ------------------------------------------------------------------ */

interface PurchaseRequestState {
  purchaseRequests: PurchaseRequest[];
  addRequest: (request: PurchaseRequest) => void;
  updateRequest: (updated: PurchaseRequest) => void;
  reset: () => void;
}

export const usePurchaseRequestStore = create<PurchaseRequestState>()(
  persist(
    (set) => ({
      purchaseRequests: [],
      addRequest: (request) =>
        set((state) => ({
          purchaseRequests: [...state.purchaseRequests, request],
        })),
      updateRequest: (updated) =>
        set((state) => ({
          purchaseRequests: state.purchaseRequests.map((r) =>
            r.id === updated.id ? updated : r
          ),
        })),
      reset: () => set({ purchaseRequests: [] }),
    }),
    {
      name: 'ef-reqs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ purchaseRequests: state.purchaseRequests }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Backward-compatible shim (consumed by existing services)          */
/*  TODO: Remove once services migrate to usePurchaseRequestStore     */
/* ------------------------------------------------------------------ */

/**
 * ⚠ INTERNAL DOMAIN STORE
 * DO NOT IMPORT THIS DIRECTLY FROM UI LAYER.
 * All mutations must go through the service layer.
 * UI must ONLY use: usePurchaseRequestStore
 */
export const purchaseRequestStore = {
  getState() {
    return usePurchaseRequestStore.getState();
  },
  addRequest(request: PurchaseRequest) {
    usePurchaseRequestStore.getState().addRequest(request);
  },
  updateRequest(updated: PurchaseRequest) {
    usePurchaseRequestStore.getState().updateRequest(updated);
  },
  reset() {
    usePurchaseRequestStore.getState().reset();
  },
};
