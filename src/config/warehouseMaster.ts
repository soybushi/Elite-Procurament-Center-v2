import type { Warehouse } from '../types';

/**
 * Canonical Warehouse Master — Single source of truth for all Elite Flower warehouses.
 *
 * Derived from the Documento Master (App.tsx defaults + Dashboard WH_TO_STATE mapping).
 * This array is read-only and should not be mutated at runtime.
 */
export const WAREHOUSE_MASTER: readonly Warehouse[] = [
  { id: 'WH-001', name: 'BAY STATE',              state: 'Massachusetts', stateCode: 'MA', type: 'flowers',   status: 'active' },
  { id: 'WH-002', name: 'ELITE CALIFORNIA',       state: 'California',    stateCode: 'CA', type: 'flowers',   status: 'active' },
  { id: 'WH-003', name: 'ELITE HARDGOODS MIAMI',  state: 'Florida',       stateCode: 'FL', type: 'hardgoods', status: 'active' },
  { id: 'WH-004', name: 'ELITE HARDGOODS 290',    state: 'Florida',       stateCode: 'FL', type: 'hardgoods', status: 'active' },
  { id: 'WH-005', name: 'ELITE LEBANON TN',       state: 'Tennessee',     stateCode: 'TN', type: 'flowers',   status: 'active' },
  { id: 'WH-006', name: 'ELITE MIAMI',            state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-007', name: 'ELITE MIAMI - SNB',      state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-008', name: 'ELITE MIAMI 120',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-009', name: 'ELITE MIAMI 250',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-010', name: 'ELITE MIAMI 280',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-011', name: 'ELITE MIAMI 290',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-012', name: 'ELITE MIAMI 340',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-013', name: 'ELITE MIAMI 725',        state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-014', name: 'ELITE MIAMI CAFETERÍA',  state: 'Florida',       stateCode: 'FL', type: 'cafeteria', status: 'active' },
  { id: 'WH-015', name: 'ELITE MIAMI SHIPPING',   state: 'Florida',       stateCode: 'FL', type: 'shipping',  status: 'active' },
  { id: 'WH-016', name: 'ELITE MIAMI SISTER CO.', state: 'Florida',       stateCode: 'FL', type: 'flowers',   status: 'active' },
  { id: 'WH-017', name: 'ELITE NEW JERSEY',       state: 'New Jersey',    stateCode: 'NJ', type: 'flowers',   status: 'active' },
  { id: 'WH-018', name: 'ELITE TEXAS',            state: 'Texas',         stateCode: 'TX', type: 'flowers',   status: 'active' },
  { id: 'WH-019', name: 'ELITE USA BQT IL',       state: 'Illinois',      stateCode: 'IL', type: 'bouquets',  status: 'active' },
  { id: 'WH-020', name: 'ELITE WASHINGTON',       state: 'Washington',    stateCode: 'WA', type: 'flowers',   status: 'active' },
  { id: 'WH-021', name: 'USA BQT MIAMI',          state: 'Florida',       stateCode: 'FL', type: 'bouquets',  status: 'active' },
] as const;

/* ------------------------------------------------------------------ */
/*  Pure utility functions                                            */
/* ------------------------------------------------------------------ */

/**
 * Find a warehouse by its canonical id (e.g. "WH-006").
 * Returns `undefined` when no match is found.
 */
export function getWarehouseById(id: string): Warehouse | undefined {
  return WAREHOUSE_MASTER.find((w) => w.id === id);
}

/**
 * Find a warehouse by its exact canonical name (case-insensitive).
 * Returns `undefined` when no match is found.
 */
export function getWarehouseByName(name: string): Warehouse | undefined {
  const normalized = normalizeWarehouseName(name);
  return WAREHOUSE_MASTER.find((w) => normalizeWarehouseName(w.name) === normalized);
}

/**
 * Normalize a warehouse name for safe comparison.
 *
 * Rules applied:
 *  1. Trim leading / trailing whitespace.
 *  2. Collapse multiple consecutive spaces / hyphens.
 *  3. Upper-case everything.
 *  4. Remove trailing punctuation (period, comma).
 *  5. Strip accented characters to their ASCII base (e.g. É → E).
 */
export function normalizeWarehouseName(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics
    .replace(/\s{2,}/g, ' ')           // collapse multiple spaces
    .replace(/-{2,}/g, '-')            // collapse multiple hyphens
    .replace(/[.,]+$/g, '');           // remove trailing punctuation
}
