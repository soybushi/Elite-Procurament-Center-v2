/* ------------------------------------------------------------------ */
/*  Supplier Defaults — Pure factory functions                        */
/*  No side-effects, no external dependencies.                        */
/* ------------------------------------------------------------------ */

import type { Supplier, SupplierPrice } from '../types';

/** Generate a simple unique id without external libraries. */
function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

/**
 * Creates a minimal valid Supplier with status 'active'.
 */
export function createSupplierBase(
  companyId: string,
  name: string,
): Supplier {
  const now = new Date().toISOString();
  return {
    id: generateId('SUP'),
    companyId,
    name,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a minimal valid SupplierPrice entry.
 */
export function createSupplierPriceBase(
  companyId: string,
  supplierId: string,
  sku: string,
  unitPrice: number,
  currency: string,
  validFromISO: string,
): SupplierPrice {
  const now = new Date().toISOString();
  return {
    id: generateId('SPR'),
    companyId,
    supplierId,
    sku,
    unitPrice,
    currency,
    validFrom: validFromISO,
    createdAt: now,
    updatedAt: now,
  };
}
