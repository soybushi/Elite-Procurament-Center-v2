import { resolveWarehouseId } from '../../utils/warehouseNormalizer'

export interface RawImportRow {
  warehouse: string
  productId: string
  quantity: number
}

export interface ParsedImportRow {
  warehouseId: string
  productId: string
  quantity: number
}

export interface ProductMasterEntry {
  id: string
}

export type ImportErrorCode =
  | 'INVALID_PRODUCT'
  | 'INVALID_WAREHOUSE'
  | 'MISSING_FIELD'
  | 'INVALID_FORMAT'

export interface InvalidRow {
  row: RawImportRow
  reason: ImportErrorCode
}

export interface ImportSummary {
  totalRows: number
  validCount: number
  invalidCount: number
  errorBreakdown: Record<ImportErrorCode, number>
}

export interface ImportResult<T> {
  summary: ImportSummary
  valid: T[]
  invalid: InvalidRow[]
}

export function parseImportRows(
  rows: RawImportRow[],
  productMaster: ProductMasterEntry[]
): ImportResult<ParsedImportRow> {
  const valid: ParsedImportRow[] = []
  const invalid: InvalidRow[] = []
  const productIds = new Set(productMaster.map((p) => p.id))
  const errorBreakdown: Record<ImportErrorCode, number> = {
    INVALID_PRODUCT: 0,
    INVALID_WAREHOUSE: 0,
    MISSING_FIELD: 0,
    INVALID_FORMAT: 0
  }

  for (const row of rows) {
    const warehouseId = resolveWarehouseId(row.warehouse)
    if (!row.warehouse || warehouseId === null) {
      invalid.push({ row, reason: 'INVALID_WAREHOUSE' })
      errorBreakdown.INVALID_WAREHOUSE++
      continue
    }
    if (!row.productId || row.productId.trim() === '') {
      invalid.push({ row, reason: 'MISSING_FIELD' })
      errorBreakdown.MISSING_FIELD++
      continue
    }
    if (typeof row.quantity !== 'number' || row.quantity <= 0) {
      invalid.push({ row, reason: 'INVALID_FORMAT' })
      errorBreakdown.INVALID_FORMAT++
      continue
    }
    if (!productIds.has(row.productId)) {
      invalid.push({ row, reason: 'INVALID_PRODUCT' })
      errorBreakdown.INVALID_PRODUCT++
      continue
    }
    valid.push({
      warehouseId,
      productId: row.productId,
      quantity: row.quantity
    })
  }
  const summary: ImportSummary = {
    totalRows: rows.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    errorBreakdown
  }
  return { summary, valid, invalid }
}
