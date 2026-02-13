/* ------------------------------------------------------------------ */
/*  Ledger Service — Policy-enforced entry points for ledger mutations */
/*  NOT connected to UI or existing modules.                          */
/*  Does NOT modify ledgerStore directly — delegates to it.           */
/* ------------------------------------------------------------------ */

import type { Movement } from '../types';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';
import { createMovementBase } from '../config/movementDefaults';
import { ledgerStore } from './ledgerStore';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';

/* ------------------------------------------------------------------ */
/*  Common params                                                     */
/* ------------------------------------------------------------------ */

interface LedgerMoveParams {
  sku: string;
  warehouseId: string;
  qty: number;
  occurredAtISO: string;
  documentId?: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/*  moveIn — Receipt of goods into a warehouse                        */
/* ------------------------------------------------------------------ */

/**
 * Records a goods receipt (move-in) into the ledger.
 *
 * Enforces `LEDGER_MOVE_IN` policy before any mutation.
 */
export function moveIn(params: LedgerMoveParams): Movement {
  const actor = getActor();
  assertCan(actor, 'LEDGER_MOVE_IN');

  const movement = createMovementBase(
    actor.companyId,
    params.sku,
    params.warehouseId,
    'receipt',
    params.qty,
    params.occurredAtISO,
  );

  if (params.documentId) {
    movement.documentId = params.documentId;
  }
  if (params.note) {
    movement.note = params.note;
  }
  movement.createdBy = actor.userId;

  ledgerStore.addMovements([movement]);

  auditStore.addLog(
    createAuditLogBase(
      actor.companyId,
      'movement',
      movement.movementId,
      'created',
      actor.userId,
      undefined,
      'receipt',
    ),
  );

  return movement;
}

/* ------------------------------------------------------------------ */
/*  moveOut — Issue of goods from a warehouse                         */
/* ------------------------------------------------------------------ */

/**
 * Records a goods issue (move-out) from the ledger.
 *
 * Enforces `LEDGER_MOVE_OUT` policy before any mutation.
 */
export function moveOut(params: LedgerMoveParams): Movement {
  const actor = getActor();
  assertCan(actor, 'LEDGER_MOVE_OUT');

  const movement = createMovementBase(
    actor.companyId,
    params.sku,
    params.warehouseId,
    'issue',
    params.qty,
    params.occurredAtISO,
  );

  if (params.documentId) {
    movement.documentId = params.documentId;
  }
  if (params.note) {
    movement.note = params.note;
  }
  movement.createdBy = actor.userId;

  ledgerStore.addMovements([movement]);

  auditStore.addLog(
    createAuditLogBase(
      actor.companyId,
      'movement',
      movement.movementId,
      'created',
      actor.userId,
      undefined,
      'issue',
    ),
  );

  return movement;
}

/* ------------------------------------------------------------------ */
/*  adjust — Inventory adjustment (positive or negative)              */
/* ------------------------------------------------------------------ */

/**
 * Records an inventory adjustment in the ledger.
 *
 * Enforces `LEDGER_ADJUST` policy before any mutation.
 */
export function adjust(params: LedgerMoveParams): Movement {
  const actor = getActor();
  assertCan(actor, 'LEDGER_ADJUST');

  const movement = createMovementBase(
    actor.companyId,
    params.sku,
    params.warehouseId,
    'adjustment',
    params.qty,
    params.occurredAtISO,
  );

  if (params.documentId) {
    movement.documentId = params.documentId;
  }
  if (params.note) {
    movement.note = params.note;
  }
  movement.createdBy = actor.userId;

  ledgerStore.addMovements([movement]);

  auditStore.addLog(
    createAuditLogBase(
      actor.companyId,
      'movement',
      movement.movementId,
      'created',
      actor.userId,
      undefined,
      'adjustment',
    ),
  );

  return movement;
}
