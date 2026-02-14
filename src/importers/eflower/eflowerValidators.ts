/* ------------------------------------------------------------------ */
/*  E Flower Import Pipeline — Validators (pure functions)            */
/*  No side-effects, no external dependencies.                        */
/* ------------------------------------------------------------------ */

import type {
  EFlowerImportKind,
  ImportError,
  StagedProduct,
  StagedMovement,
} from './types';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

/** Returns true when the string is a valid ISO-8601 date (parseable by Date). */
function isValidISODate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function err(
  rowIndex: number,
  code: string,
  message: string,
  field?: string,
  raw?: unknown,
): ImportError {
  return { rowIndex, code, message, field, raw };
}

/* ------------------------------------------------------------------ */
/*  Batch-level validation                                            */
/* ------------------------------------------------------------------ */

/**
 * Validates basic batch invariants before per-row processing.
 *
 * Rules:
 *  - `rows` must not be empty.
 *  - Each row must not be entirely empty (all values falsy).
 */
export function validateBatchBasics(
  _kind: EFlowerImportKind,
  rows: Record<string, unknown>[],
): ImportError[] {
  const errors: ImportError[] = [];

  if (rows.length === 0) {
    errors.push(err(-1, 'BATCH_EMPTY', 'The batch contains no rows.'));
    return errors;
  }

  rows.forEach((row, idx) => {
    const hasValue = Object.values(row).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== '',
    );
    if (!hasValue) {
      errors.push(err(idx, 'ROW_EMPTY', 'Row is completely empty.'));
    }
  });

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Staged product validation                                         */
/* ------------------------------------------------------------------ */

/**
 * Validates a single `StagedProduct`.
 *
 * Rules:
 *  - `sku` is required and non-empty.
 *  - `name` is required and non-empty.
 */
export function validateStagedProduct(
  product: StagedProduct,
  rowIndex: number,
): ImportError[] {
  const errors: ImportError[] = [];

  if (!product.sku || product.sku.trim() === '') {
    errors.push(
      err(rowIndex, 'PRODUCT_SKU_REQUIRED', 'Product SKU is required.', 'sku', product.raw),
    );
  }

  if (!product.name || product.name.trim() === '') {
    errors.push(
      err(rowIndex, 'PRODUCT_NAME_REQUIRED', 'Product name is required.', 'name', product.raw),
    );
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Staged movement validation                                        */
/* ------------------------------------------------------------------ */

/**
 * Validates a single `StagedMovement`.
 *
 * Rules:
 *  - `sku` is required and non-empty.
 *  - `warehouseName` is required and non-empty.
 *  - `qty` must be > 0, unless `type` is `'adjustment'` (which allows negative).
 *  - `occurredAt` must be a valid ISO date string.
 */
export function validateStagedMovement(
  movement: StagedMovement,
  rowIndex: number,
): ImportError[] {
  const errors: ImportError[] = [];

  if (!movement.sku || movement.sku.trim() === '') {
    errors.push(
      err(rowIndex, 'MOVEMENT_SKU_REQUIRED', 'Movement SKU is required.', 'sku', movement.raw),
    );
  }

  if (!movement.warehouseName || movement.warehouseName.trim() === '') {
    errors.push(
      err(
        rowIndex,
        'MOVEMENT_WAREHOUSE_REQUIRED',
        'Warehouse name is required.',
        'warehouseName',
        movement.raw,
      ),
    );
  }

  if (movement.type !== 'adjustment' && movement.qty <= 0) {
    errors.push(
      err(
        rowIndex,
        'MOVEMENT_QTY_POSITIVE',
        'Quantity must be greater than zero for non-adjustment movements.',
        'qty',
        movement.raw,
      ),
    );
  }

  if (!isValidISODate(movement.occurredAt)) {
    errors.push(
      err(
        rowIndex,
        'MOVEMENT_DATE_INVALID',
        'occurredAt must be a valid ISO date.',
        'occurredAt',
        movement.raw,
      ),
    );
  }

  return errors;
}
