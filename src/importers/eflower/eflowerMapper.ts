/* ------------------------------------------------------------------ */
/*  E Flower Import Pipeline — Row mapper (staging)                   */
/*  Pure functions — no side-effects, no external dependencies.       */
/* ------------------------------------------------------------------ */

import { normalizeWarehouseInput } from '../../config/warehouseMaster';
import { validateBatchBasics, validateStagedProduct, validateStagedMovement } from './eflowerValidators';
import type {
  EFlowerImportKind,
  ImportBatch,
  ImportError,
  ImportResult,
  StagedProduct,
  StagedMovement,
} from './types';

/* ------------------------------------------------------------------ */
/*  Internal helpers — defensive field reading                        */
/* ------------------------------------------------------------------ */

/**
 * Read a value from a row trying several alternate column names.
 * Returns the first truthy value found, or `undefined`.
 */
function pick(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k] ?? row[k.toUpperCase()] ?? row[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return undefined;
}

/** Same as pick but returns a number (or undefined). */
function pickNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  const raw = pick(row, ...keys);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Generate a simple batch ID without external libraries. */
function createBatchId(): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `BATCH-${Date.now()}-${random}`;
}

/* ------------------------------------------------------------------ */
/*  Kind-specific row mappers                                         */
/* ------------------------------------------------------------------ */

function mapProductRow(row: Record<string, unknown>): StagedProduct {
  return {
    sku: pick(row, 'E CODE', 'ECODE', 'CODE', 'Codigo', 'SKU', 'sku') ?? '',
    name: pick(row, 'PRODUCT NAME', 'PRODUCT', 'Producto', 'Name', 'NOMBRE', 'Nombre') ?? '',
    categoryName: pick(row, 'CATEGORY', 'Categoria', 'CAT', 'Category'),
    subcategoryName: pick(row, 'SUB CATEGORY', 'SUBCATEGORY', 'SubCategoria', 'SUB', 'Subcategory'),
    uomName: pick(row, 'UOM', 'UNIDAD', 'Unit', 'Unidad'),
    packSize: pick(row, 'SIZE', 'PACK', 'PackSize', 'Tamaño', 'Tamano'),
    externalRefs: buildExternalRefs(row),
    raw: { ...row },
  };
}

function mapInventoryMovementRow(row: Record<string, unknown>): StagedMovement {
  return {
    sku: pick(row, 'E CODE', 'ECODE', 'CODE', 'SKU', 'Codigo', 'sku') ?? '',
    warehouseName: normalizeWarehouseInput(
      pick(row, 'WAREHOUSE', 'Bodega', 'WH', 'warehouse', 'BODEGA') ?? '',
    ),
    type: 'receipt',
    qty: pickNumber(row, 'CANTIDAD', 'QTY', 'Qty', 'Quantity', 'QUANTITY') ?? 0,
    occurredAt: pick(row, 'FECHA', 'DATE', 'Date', 'Fecha') ?? new Date().toISOString(),
    unitCost: pickNumber(row, 'COSTO', 'UNIT COST', 'UnitCost', 'PRECIO', 'Price'),
    documentRef: pick(row, 'DOCUMENTO', 'DOC', 'Document', 'PO', 'NUMERO', 'Number'),
    externalRefs: buildExternalRefs(row),
    raw: { ...row },
  };
}

function mapHistoryRow(row: Record<string, unknown>): StagedMovement {
  return {
    sku: pick(row, 'PRODUCT', 'Producto', 'E CODE', 'SKU', 'sku') ?? '',
    warehouseName: normalizeWarehouseInput(
      pick(row, 'WAREHOUSE', 'Bodega', 'WH', 'BODEGA') ?? '',
    ),
    type: 'receipt',
    qty: pickNumber(row, 'CANTIDAD', 'QTY', 'Qty', 'Quantity', 'QUANTITY') ?? 0,
    occurredAt: pick(row, 'FECHA', 'DATE', 'Date', 'Fecha') ?? new Date().toISOString(),
    unitCost: pickNumber(row, 'UNIT PRICE', 'UnitPrice', 'PRECIO UNITARIO', 'COSTO'),
    documentRef: pick(row, 'PO', 'NUMERO', 'Number', 'PO #', 'Orden'),
    externalRefs: buildExternalRefs(row),
    raw: { ...row },
  };
}

function mapOpenOrderRow(row: Record<string, unknown>): StagedMovement {
  return {
    sku: pick(row, 'PRODUCT', 'Producto', 'E CODE', 'SKU') ?? '',
    warehouseName: normalizeWarehouseInput(
      pick(row, 'WAREHOUSE', 'Bodega', 'WH', 'BODEGA') ?? '',
    ),
    type: 'receipt',
    qty: pickNumber(row, 'QTY ORDERED', 'CANTIDAD', 'QTY', 'Qty') ?? 0,
    occurredAt: pick(row, 'DELIVERY DATE', 'FECHA', 'DATE', 'Date') ?? new Date().toISOString(),
    unitCost: pickNumber(row, 'TOTAL', 'UNIT PRICE', 'PRECIO'),
    documentRef: pick(row, 'PO', 'NUMERO', 'Number', 'PO #'),
    externalRefs: buildExternalRefs(row),
    raw: { ...row },
  };
}

function mapPriceRow(row: Record<string, unknown>): StagedProduct {
  return {
    sku: pick(row, 'E CODE', 'ECODE', 'CODE', 'SKU', 'Codigo') ?? '',
    name: pick(row, 'PRODUCT NAME', 'PRODUCT', 'Producto', 'Nombre') ?? '',
    categoryName: pick(row, 'CATEGORY', 'Categoria', 'CAT'),
    subcategoryName: pick(row, 'SUB CATEGORY', 'SUBCATEGORY', 'SubCategoria'),
    externalRefs: {
      ...buildExternalRefs(row),
      supplier: pick(row, 'SUPPLIER', 'PROV', 'Proveedor', 'Supplier') ?? '',
      price: String(pickNumber(row, 'PRICE', 'PRECIO', 'Price', 'Unit Price') ?? ''),
    },
    raw: { ...row },
  };
}

/** Collect any fields that look like external reference identifiers. */
function buildExternalRefs(row: Record<string, unknown>): Record<string, string> | undefined {
  const refs: Record<string, string> = {};
  const id = pick(row, 'E CODE', 'ECODE', 'CODE');
  if (id) refs['eCode'] = id;
  const po = pick(row, 'PO', 'NUMERO', 'Number');
  if (po) refs['po'] = po;
  return Object.keys(refs).length > 0 ? refs : undefined;
}

/* ------------------------------------------------------------------ */
/*  Public entry point                                                */
/* ------------------------------------------------------------------ */

/**
 * Maps raw E Flower rows into the staging area.
 *
 * - Reads fields defensively using alternate column names.
 * - Normalises warehouse names via `normalizeWarehouseInput`.
 * - Validates each staged record and populates batch errors.
 * - Returns a fully formed `ImportResult`.
 */
export function mapEFlowerRowsToStaging(
  companyId: string,
  kind: EFlowerImportKind,
  rows: Record<string, unknown>[],
  sourceFileName: string,
): ImportResult {
  const batchId = createBatchId();
  const receivedAt = new Date().toISOString();

  const products: StagedProduct[] = [];
  const movements: StagedMovement[] = [];
  const errors: ImportError[] = [];

  // ---- General batch-level validation ----
  const batchErrors = validateBatchBasics(kind, rows);
  errors.push(...batchErrors);

  // ---- Per-row mapping based on kind ----
  rows.forEach((row, idx) => {
    switch (kind) {
      case 'MOD_PRODUCT_LIST': {
        const p = mapProductRow(row);
        const pErrors = validateStagedProduct(p, idx);
        if (pErrors.length === 0) {
          products.push(p);
        } else {
          errors.push(...pErrors);
        }
        break;
      }
      case 'MOD_PRICE_LIST':
      case 'REF_PRECIOS_PROVEEDOR': {
        const p = mapPriceRow(row);
        const pErrors = validateStagedProduct(p, idx);
        if (pErrors.length === 0) {
          products.push(p);
        } else {
          errors.push(...pErrors);
        }
        break;
      }
      case 'REF_INVENTARIOS': {
        const m = mapInventoryMovementRow(row);
        const mErrors = validateStagedMovement(m, idx);
        if (mErrors.length === 0) {
          movements.push(m);
        } else {
          errors.push(...mErrors);
        }
        break;
      }
      case 'REF_HISTORIAL_COMPRAS': {
        const m = mapHistoryRow(row);
        const mErrors = validateStagedMovement(m, idx);
        if (mErrors.length === 0) {
          movements.push(m);
        } else {
          errors.push(...mErrors);
        }
        break;
      }
      case 'REF_ORDENES_ABIERTAS': {
        const m = mapOpenOrderRow(row);
        const mErrors = validateStagedMovement(m, idx);
        if (mErrors.length === 0) {
          movements.push(m);
        } else {
          errors.push(...mErrors);
        }
        break;
      }
      case 'REF_INFO_PROVEEDORES': {
        // Supplier info does not produce products or movements in staging.
        // It will be handled at a later resolution phase.
        break;
      }
    }
  });

  const rowsValid = products.length + movements.length;
  const rowsRejected = rows.length - rowsValid;

  const batch: ImportBatch = {
    batchId,
    companyId,
    kind,
    sourceFileName,
    receivedAt,
    rowsReceived: rows.length,
    rowsValid,
    rowsRejected: rowsRejected < 0 ? 0 : rowsRejected,
    errors,
  };

  return {
    batch,
    staged: { products, movements },
  };
}
