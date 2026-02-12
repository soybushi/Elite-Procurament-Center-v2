/* ------------------------------------------------------------------ */
/*  Ledger Inspector — Pure analytical queries over ledgerStore        */
/*  Read-only; no mutations, no side-effects, no external deps.       */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';
import { ledgerStore } from './ledgerStore';

/* ------------------------------------------------------------------ */
/*  getMovementsBySku                                                 */
/* ------------------------------------------------------------------ */

/**
 * Returns all movements matching the given SKU.
 * Optionally filters by warehouseId (origin OR destination).
 */
export function getMovementsBySku(
  sku: string,
  warehouseId?: string,
): Movement[] {
  const { movements } = ledgerStore.getState();
  return movements.filter((m) => {
    if (m.sku !== sku) return false;
    if (warehouseId === undefined) return true;
    return m.warehouseId === warehouseId || m.warehouseIdTo === warehouseId;
  });
}

/* ------------------------------------------------------------------ */
/*  getBalanceBySku                                                   */
/* ------------------------------------------------------------------ */

/**
 * Computes the current balance of a SKU in a specific warehouse by
 * replaying all movements:
 *
 *  receipt    → +qty
 *  issue      → −qty
 *  adjustment → +qty (sign preserved; negative qty subtracts)
 *  transfer   → −qty when warehouseId is origin,
 *               +qty when warehouseId is destination
 */
export function getBalanceBySku(
  sku: string,
  warehouseId: string,
): { sku: string; warehouseId: string; balance: number } {
  const { movements } = ledgerStore.getState();
  let balance = 0;

  for (const m of movements) {
    if (m.sku !== sku) continue;

    switch (m.type) {
      case 'receipt':
        if (m.warehouseId === warehouseId) balance += m.qty;
        break;
      case 'issue':
        if (m.warehouseId === warehouseId) balance -= m.qty;
        break;
      case 'adjustment':
        if (m.warehouseId === warehouseId) balance += m.qty;
        break;
      case 'transfer':
        if (m.warehouseId === warehouseId) balance -= m.qty;
        if (m.warehouseIdTo === warehouseId) balance += m.qty;
        break;
    }
  }

  return { sku, warehouseId, balance };
}

/* ------------------------------------------------------------------ */
/*  getWarehouseSummary                                               */
/* ------------------------------------------------------------------ */

export interface WarehouseSummary {
  totalMovements: number;
  totalReceipts: number;
  totalIssues: number;
  totalAdjustments: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
}

/**
 * Aggregates movement counts for a warehouse across all SKUs.
 */
export function getWarehouseSummary(warehouseId: string): WarehouseSummary {
  const { movements } = ledgerStore.getState();

  let totalMovements = 0;
  let totalReceipts = 0;
  let totalIssues = 0;
  let totalAdjustments = 0;
  let totalTransfersIn = 0;
  let totalTransfersOut = 0;

  for (const m of movements) {
    const isOrigin = m.warehouseId === warehouseId;
    const isDest = m.warehouseIdTo === warehouseId;

    if (!isOrigin && !isDest) continue;

    totalMovements++;

    switch (m.type) {
      case 'receipt':
        if (isOrigin) totalReceipts++;
        break;
      case 'issue':
        if (isOrigin) totalIssues++;
        break;
      case 'adjustment':
        if (isOrigin) totalAdjustments++;
        break;
      case 'transfer':
        if (isOrigin) totalTransfersOut++;
        if (isDest) totalTransfersIn++;
        break;
    }
  }

  return {
    totalMovements,
    totalReceipts,
    totalIssues,
    totalAdjustments,
    totalTransfersIn,
    totalTransfersOut,
  };
}

/* ------------------------------------------------------------------ */
/*  getSkuKardex                                                      */
/* ------------------------------------------------------------------ */

export interface KardexEntry {
  occurredAt: string;
  type: Movement['type'];
  qty: number;
  runningBalance: number;
}

/**
 * Builds a chronological kardex (journal) for a SKU in a warehouse,
 * sorted ascending by `occurredAt`, with a running balance.
 */
export function getSkuKardex(
  sku: string,
  warehouseId: string,
): KardexEntry[] {
  const { movements } = ledgerStore.getState();

  // Collect relevant movements and compute their signed delta.
  const relevant: { m: Movement; delta: number }[] = [];

  for (const m of movements) {
    if (m.sku !== sku) continue;

    let delta: number | null = null;

    switch (m.type) {
      case 'receipt':
        if (m.warehouseId === warehouseId) delta = m.qty;
        break;
      case 'issue':
        if (m.warehouseId === warehouseId) delta = -m.qty;
        break;
      case 'adjustment':
        if (m.warehouseId === warehouseId) delta = m.qty;
        break;
      case 'transfer':
        if (m.warehouseId === warehouseId) delta = -m.qty;
        else if (m.warehouseIdTo === warehouseId) delta = m.qty;
        break;
    }

    if (delta !== null) {
      relevant.push({ m, delta });
    }
  }

  // Sort by occurredAt ascending (stable sort by createdAt as tiebreaker).
  relevant.sort((a, b) => {
    const cmp = a.m.occurredAt.localeCompare(b.m.occurredAt);
    if (cmp !== 0) return cmp;
    return a.m.createdAt.localeCompare(b.m.createdAt);
  });

  // Build kardex with running balance.
  let balance = 0;
  return relevant.map(({ m, delta }) => {
    balance += delta;
    return {
      occurredAt: m.occurredAt,
      type: m.type,
      qty: m.qty,
      runningBalance: balance,
    };
  });
}
