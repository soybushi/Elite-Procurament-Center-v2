/* ------------------------------------------------------------------ */
/*  Ledger Store — Minimal in-memory store (no external libraries)    */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';
import type { LedgerState } from './types';

/* ------------------------------------------------------------------ */
/*  Internal mutable state                                            */
/* ------------------------------------------------------------------ */

function createEmptyState(companyId: string): LedgerState {
  return {
    companyId,
    movements: [],
    importedBatches: {},
  };
}

let _state: LedgerState = createEmptyState('');

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export const ledgerStore = {
  /** Return a shallow copy of the current state. */
  getState(): LedgerState {
    return { ..._state, movements: [..._state.movements] };
  },

  /** Replace the entire state (for testing or hydration). */
  setState(next: LedgerState): void {
    _state = next;
  },

  /** Reset state for a given company, clearing all data. */
  reset(companyId: string): void {
    _state = createEmptyState(companyId);
  },

  /** Append movements to the current state. */
  addMovements(movs: Movement[]): void {
    _state.movements.push(...movs);
  },
} as const;
