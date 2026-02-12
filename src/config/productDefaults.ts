import type { Product, ProductFlags } from '../types';

/**
 * Returns the default flags for a new Product.
 * Pure function — no side-effects, no external dependencies.
 */
export function buildProductDefaults(): ProductFlags {
  return {
    trackInventory: true,
    trackCost: true,
    isHardgoods: false,
    isBouquet: false,
    isFlower: false,
  };
}

/**
 * Creates a minimal valid Product with sensible defaults.
 * Timestamps are generated at call-time in ISO-8601 format.
 */
export function createEmptyProduct(
  companyId: string,
  sku: string,
  name: string,
): Product {
  const now = new Date().toISOString();
  return {
    companyId,
    productId: '',
    sku,
    name,
    status: 'active',
    flags: buildProductDefaults(),
    createdAt: now,
    updatedAt: now,
  };
}
