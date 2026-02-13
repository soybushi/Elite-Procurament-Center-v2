import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PurchaseOrder, PurchaseOrderLine } from '../types';

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

export const usePurchaseOrderStore = create<PurchaseOrderState>()(
  persist(
    (set) => ({
      purchaseOrders: [],
      purchaseOrderLines: [],

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
      storage: createJSONStorage(() => localStorage),
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
