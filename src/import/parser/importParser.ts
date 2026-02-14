import { normalizeWarehouseName } from '../../utils/warehouseNormalizer'

export interface RawImportRow {
  warehouse: string
  productId: string
  quantity: number
}

export interface ParsedImportRow {
  warehouse: string
  productId: string
  quantity: number
}

export interface ImportParseResult {
  valid: ParsedImportRow[]
  invalid: { row: RawImportRow; reason: string }[]
}

export function parseImportRows(rows: RawImportRow[]): ImportParseResult {
  const valid: ParsedImportRow[] = []
  const invalid: { row: RawImportRow; reason: string }[] = []

  for (const row of rows) {
    const normalizedWarehouse = normalizeWarehouseName(row.warehouse)
    if (!row.warehouse || normalizedWarehouse === '') {
      invalid.push({ row, reason: 'Warehouse vacío o inválido' })
      continue
    }
    if (!row.productId || row.productId.trim() === '') {
      invalid.push({ row, reason: 'ProductId vacío' })
      continue
    }
    if (typeof row.quantity !== 'number' || row.quantity <= 0) {
      invalid.push({ row, reason: 'Quantity debe ser > 0' })
      continue
    }
    valid.push({
      warehouse: normalizedWarehouse,
      productId: row.productId,
      quantity: row.quantity
    })
  }
  return { valid, invalid }
}
