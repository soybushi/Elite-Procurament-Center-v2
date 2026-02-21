import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PurchaseOrder, PurchaseOrderLine } from '../types';
import { idbStorage } from '../infra/idbStorage';

/* ------------------------------------------------------------------ */
/*  Zustand-based reactive store for PurchaseOrders                   */
/*  Persisted to localStorage under key "ef-pos".                     */
/* ------------------------------------------------------------------ */

interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  addOrder: (order: PurchaseOrder) => void;
  addOrders: (orders: PurchaseOrder[]) => void;
  addLines: (lines: PurchaseOrderLine[]) => void;
  reset: () => void;
}

function readLegacyPurchaseOrders(): {
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
} {
  if (typeof window === 'undefined') {
    return { purchaseOrders: [], purchaseOrderLines: [] };
  }
  try {
    const raw = window.localStorage.getItem('ef-pos');
    if (!raw) return { purchaseOrders: [], purchaseOrderLines: [] };
    const parsed = JSON.parse(raw) as {
      state?: { purchaseOrders?: PurchaseOrder[]; purchaseOrderLines?: PurchaseOrderLine[] };
    };
    return {
      purchaseOrders: parsed?.state?.purchaseOrders ?? [],
      purchaseOrderLines: parsed?.state?.purchaseOrderLines ?? [],
    };
  } catch {
    return { purchaseOrders: [], purchaseOrderLines: [] };
  }
}

export const usePurchaseOrderStore = create<PurchaseOrderState>()(
  persist(
    (set) => ({
      ...readLegacyPurchaseOrders(),

      addOrder: (order: PurchaseOrder) =>
        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, order],
        })),

      addOrders: (orders: PurchaseOrder[]) =>
        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, ...orders],
        })),

      addLines: (lines: PurchaseOrderLine[]) =>
        set((state) => ({
          purchaseOrderLines: [...state.purchaseOrderLines, ...lines],
        })),

      reset: () =>
        set({
          purchaseOrders: [],
          purchaseOrderLines: [],
        }),
    }),
    {
      name: 'ef-pos',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        purchaseOrders: state.purchaseOrders,
        purchaseOrderLines: state.purchaseOrderLines,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Backward-compatible shim (consumed by existing services)          */
/*  TODO: Remove once services migrate to usePurchaseOrderStore       */
/* ------------------------------------------------------------------ */

/**
 * ⚠ INTERNAL DOMAIN STORE
 * DO NOT IMPORT THIS DIRECTLY FROM UI LAYER.
 * All mutations must go through the service layer.
 * UI must ONLY use: usePurchaseOrderStore
 */
export const purchaseOrderStore = {
  getState: () => usePurchaseOrderStore.getState(),
  addOrder: (order: PurchaseOrder) =>
    usePurchaseOrderStore.getState().addOrder(order),
  addOrders: (orders: PurchaseOrder[]) =>
    usePurchaseOrderStore.getState().addOrders(orders),
  addLines: (lines: PurchaseOrderLine[]) =>
    usePurchaseOrderStore.getState().addLines(lines),
  reset: () => usePurchaseOrderStore.getState().reset(),
};
