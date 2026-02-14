import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TransferItem } from '../types';

/* ------------------------------------------------------------------ */
/*  Zustand-based reactive store for Transfers                        */
/*  Persisted to localStorage under key "ef-transfers".               */
/* ------------------------------------------------------------------ */

interface TransferState {
  transfers: TransferItem[];
  addTransfer: (transfer: TransferItem) => void;
  updateTransfer: (updated: TransferItem) => void;
  reset: () => void;
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set) => ({
      transfers: [],
      addTransfer: (transfer) =>
        set((state) => ({
          transfers: [...state.transfers, transfer],
        })),
      updateTransfer: (updated) =>
        set((state) => ({
          transfers: state.transfers.map((t) =>
            t.id === updated.id ? updated : t
          ),
        })),
      reset: () => set({ transfers: [] }),
    }),
    {
      name: 'ef-transfers',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ transfers: state.transfers }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Backward-compatible shim (consumed by existing services)          */
/*  TODO: Remove once services migrate to useTransferStore            */
/* ------------------------------------------------------------------ */

/**
 * ⚠ INTERNAL DOMAIN STORE
 * DO NOT IMPORT THIS DIRECTLY FROM UI LAYER.
 * All mutations must go through transferService.
 * UI must ONLY use: useTransferStore
 */
export const transferStore = {
  getState() {
    return useTransferStore.getState();
  },
  addTransfer(transfer: TransferItem) {
    useTransferStore.getState().addTransfer(transfer);
  },
  updateTransfer(updated: TransferItem) {
    useTransferStore.getState().updateTransfer(updated);
  },
  reset() {
    useTransferStore.getState().reset();
  },
};
