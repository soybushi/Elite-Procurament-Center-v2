/* ------------------------------------------------------------------ */
/*  Audit Defaults — Pure factory function for AuditLog entries       */
/*  No side-effects, no external dependencies.                        */
/* ------------------------------------------------------------------ */

import type { AuditEntityType, AuditAction, AuditLog } from '../types';

/** Generate a simple unique id without external libraries. */
function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

/**
 * Creates a minimal valid AuditLog entry.
 */
export function createAuditLogBase(
  companyId: string,
  entityType: AuditEntityType,
  entityId: string,
  action: AuditAction,
  performedByUserId: string,
  fromValue?: string,
  toValue?: string,
  metadata?: Record<string, unknown>,
): AuditLog {
  return {
    id: generateId('AUD'),
    companyId,
    entityType,
    entityId,
    action,
    fromValue,
    toValue,
    performedByUserId,
    performedAt: new Date().toISOString(),
    metadata,
  };
}
