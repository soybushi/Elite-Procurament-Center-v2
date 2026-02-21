/* ------------------------------------------------------------------ */
/*  ⚠ INTERNAL DOMAIN STORE — do NOT import in UI components.        */
/*  All writes go through ledgerService.ts facade functions.          */
/*  Inspectors may use ledgerStore.getState() for read-only access.  */
/* ------------------------------------------------------------------ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Movement } from '../types';
import type { LedgerState } from './types';
import { idbStorage } from '../infra/idbStorage';

/* ------------------------------------------------------------------ */
/*  Zustand state shape (data + actions)                              */
/* ------------------------------------------------------------------ */

interface LedgerZustandState extends LedgerState {
  /** Replace the entire state (for testing or hydration). */
  _setState: (next: LedgerState) => void;
  /** Reset state for a given company, clearing all data. */
  _reset: (companyId: string) => void;
  /** Append movements to the current state. */
  _addMovements: (movs: Movement[]) => void;
}

function readLegacyLedgerState(): LedgerState {
  if (typeof window === 'undefined') {
    return { companyId: '', movements: [], importedBatches: {} };
  }
  try {
    const raw = window.localStorage.getItem('ef-ledger');
    if (!raw) return { companyId: '', movements: [], importedBatches: {} };
    const parsed = JSON.parse(raw) as { state?: LedgerState };
    return {
      companyId: parsed?.state?.companyId ?? '',
      movements: parsed?.state?.movements ?? [],
      importedBatches: parsed?.state?.importedBatches ?? {},
    };
  } catch {
    return { companyId: '', movements: [], importedBatches: {} };
  }
}

/* ------------------------------------------------------------------ */
/*  Reactive Zustand store — persisted to localStorage "ef-ledger"   */
/* ------------------------------------------------------------------ */

export const useLedgerStore = create<LedgerZustandState>()(
  persist(
    (set) => ({
      ...readLegacyLedgerState(),

      _setState: (next: LedgerState) =>
        set({
          companyId: next.companyId,
          movements: next.movements,
          importedBatches: next.importedBatches,
        }),

      _reset: (companyId: string) =>
        set({
          companyId,
          movements: [],
          importedBatches: {},
        }),

      _addMovements: (movs: Movement[]) =>
        set((state) => ({
          movements: [...state.movements, ...movs],
        })),
    }),
    {
      name: 'ef-ledger',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        companyId: state.companyId,
        movements: state.movements,
        importedBatches: state.importedBatches,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Backward-compatible shim — keeps exact same public API            */
/*  Consumed by ledgerService, inspectors, and test helpers.          */
/* ------------------------------------------------------------------ */

export const ledgerStore = {
  /** Return a shallow copy of the current state. */
  getState(): LedgerState {
    const s = useLedgerStore.getState();
    return {
      companyId: s.companyId,
      movements: [...s.movements],
      importedBatches: s.importedBatches,
    };
  },

  /** Replace the entire state (for testing or hydration). */
  setState(next: LedgerState): void {
    useLedgerStore.getState()._setState(next);
  },

  /** Reset state for a given company, clearing all data. */
  reset(companyId: string): void {
    useLedgerStore.getState()._reset(companyId);
  },

  /** Append movements to the current state. */
  addMovements(movs: Movement[]): void {
    useLedgerStore.getState()._addMovements(movs);
  },
} as const;
