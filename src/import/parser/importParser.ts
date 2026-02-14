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

export interface ProductMasterEntry {
  id: string
}

export function parseImportRows(
  rows: RawImportRow[],
  productMaster: ProductMasterEntry[]
): ImportParseResult {
  const valid: ParsedImportRow[] = []
  const invalid: { row: RawImportRow; reason: string }[] = []
  const productIds = new Set(productMaster.map((p) => p.id))

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
    if (!productIds.has(row.productId)) {
      invalid.push({ row, reason: 'PRODUCT_NOT_FOUND' })
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
