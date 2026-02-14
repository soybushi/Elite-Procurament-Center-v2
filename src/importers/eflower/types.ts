/* ------------------------------------------------------------------ */
/*  E Flower Import Pipeline — Staging types                          */
/*  Isolated from canonical types in src/types/index.ts               */
/* ------------------------------------------------------------------ */

/** Identifies which E Flower reference / module feed is being imported. */
export type EFlowerImportKind =
  | 'REF_INVENTARIOS'
  | 'REF_HISTORIAL_COMPRAS'
  | 'REF_ORDENES_ABIERTAS'
  | 'REF_PRECIOS_PROVEEDOR'
  | 'REF_INFO_PROVEEDORES'
  | 'MOD_PRODUCT_LIST'
  | 'MOD_PRICE_LIST';

/** A single validation / parsing error attached to one row. */
export interface ImportError {
  rowIndex: number;
  code: string;
  message: string;
  field?: string;
  raw?: unknown;
}

/** Metadata for an import batch. */
export interface ImportBatch {
  batchId: string;
  companyId: string;
  kind: EFlowerImportKind;
  sourceFileName: string;
  receivedAt: string;
  rowsReceived: number;
  rowsValid: number;
  rowsRejected: number;
  errors: ImportError[];
}

/** A product row in the staging area — not yet committed to the canonical model. */
export interface StagedProduct {
  sku: string;
  name: string;
  categoryName?: string;
  subcategoryName?: string;
  uomName?: string;
  packSize?: string;
  flags?: Partial<{
    trackInventory: boolean;
    trackCost: boolean;
    isHardgoods: boolean;
    isBouquet: boolean;
    isFlower: boolean;
  }>;
  externalRefs?: Record<string, string>;
  raw: Record<string, unknown>;
}

/** A movement row in the staging area — not yet committed to the canonical model. */
export interface StagedMovement {
  sku: string;
  warehouseName: string;
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer';
  qty: number;
  occurredAt: string;
  unitCost?: number;
  documentRef?: string;
  externalRefs?: Record<string, string>;
  raw: Record<string, unknown>;
}

/** The full result returned by the mapper after processing one batch. */
export interface ImportResult {
  batch: ImportBatch;
  staged: {
    products: StagedProduct[];
    movements: StagedMovement[];
  };
}
