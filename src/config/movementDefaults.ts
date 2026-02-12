import type { Movement, MovementType, MovementSource } from '../types';

/**
 * Returns sensible defaults for a new Movement record.
 * Pure function — no side-effects, no external dependencies.
 */
export function buildMovementDefaults(): { source: MovementSource } {
  return { source: 'manual' };
}

/**
 * Generates a simple unique movement ID without external libraries.
 * Format: "MOV-<timestamp>-<random4>"
 */
export function createMovementId(): string {
  const random = Math.random().toString(36).substring(2, 6);
  return `MOV-${Date.now()}-${random}`;
}

/**
 * Creates a minimal valid Movement with sensible defaults.
 * Timestamps use ISO-8601 format; no external libraries required.
 */
export function createMovementBase(
  companyId: string,
  sku: string,
  warehouseId: string,
  type: MovementType,
  qty: number,
  occurredAtISO: string,
): Movement {
  const defaults = buildMovementDefaults();
  return {
    companyId,
    movementId: createMovementId(),
    type,
    warehouseId,
    sku,
    qty,
    occurredAt: occurredAtISO,
    createdAt: new Date().toISOString(),
    source: defaults.source,
  };
}
