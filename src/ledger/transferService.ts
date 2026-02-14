/* ------------------------------------------------------------------ */
/*  Transfer Service — Authorized entry point for Transfer mutations  */
/*  All UI-initiated transfer operations must go through this layer.  */
/* ------------------------------------------------------------------ */

import type { TransferItem } from '../types';
import { transferStore } from './transferStore';
import { createAuditLogBase } from '../config/auditDefaults';
import { auditStore } from './auditStore';
import { assertCan } from '../core/security/policyEngine';
import { getActor } from '../stores/authStore';

/* ------------------------------------------------------------------ */
/*  Input type — minimal data the caller must provide                 */
/* ------------------------------------------------------------------ */

export interface CreateTransferInput {
  /** Origin warehouse */
  fr: string;
  /** Destination warehouse */
  to: string;
  /** Items to transfer */
  it: { nm: string; qt: number }[];
  /** Notes */
  nt?: string;
}

/* ------------------------------------------------------------------ */
/*  ID helper                                                         */
/* ------------------------------------------------------------------ */

let _seqCounter = 0;

function generateId(): string {
  _seqCounter += 1;
  return (
    'TRF-' +
    new Date().getFullYear() +
    '-' +
    String(_seqCounter).padStart(3, '0')
  );
}

/** Seed the counter from existing data (e.g. after hydration). */
export function seedTransferIdCounter(existingCount: number): void {
  _seqCounter = existingCount;
}

/* ------------------------------------------------------------------ */
/*  Service functions                                                 */
/* ------------------------------------------------------------------ */

/**
 * Creates a new Transfer, persists it in the store, and records an
 * audit log entry.
 *
 * Responsibilities handled by the service (callers must NOT set these):
 *  - id         → auto-generated
 *  - st         → always 'pending'
 *  - cr         → current date
 *  - dp / rv    → null (set later via updateTransfer)
 */
export function createTransfer(input: CreateTransferInput): TransferItem {
  const actor = getActor();
  assertCan(actor, 'TRANSFER_CREATE');

  const id = generateId();
  const now = new Date().toISOString().split('T')[0];

  const transfer: TransferItem = {
    id,
    fr: input.fr,
    to: input.to,
    it: input.it,
    st: 'pending',
    cr: now,
    dp: null,
    rv: null,
    nt: input.nt ?? '',
  };

  transferStore.addTransfer(transfer);

  const log = createAuditLogBase(
    actor.companyId,
    'transfer',
    transfer.id,
    'created',
    actor.userId,
  );

  auditStore.addLog(log);

  return transfer;
}

/**
 * Updates an existing Transfer's fields, persists the change, and
 * records an audit log entry.
 */
export function updateTransfer(updated: TransferItem): void {
  const actor = getActor();
  assertCan(actor, 'TRANSFER_UPDATE');

  const current = transferStore
    .getState()
    .transfers.find((t) => t.id === updated.id);

  if (!current) {
    throw new Error('Transfer not found.');
  }

  transferStore.updateTransfer(updated);

  const log = createAuditLogBase(
    actor.companyId,
    'transfer',
    updated.id,
    'updated',
    actor.userId,
  );

  auditStore.addLog(log);
}

/**
 * Returns true if a Transfer with the given id exists in the store.
 */
export function existsTransferById(id: string): boolean {
  return transferStore
    .getState()
    .transfers.some((t) => t.id === id);
}
