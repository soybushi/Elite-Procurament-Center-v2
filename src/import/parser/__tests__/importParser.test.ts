import { describe, it, expect } from 'vitest'
import { parseImportRows, RawImportRow, ProductMasterEntry, ImportErrorCode } from '../importParser'

describe('parseImportRows', () => {
  const productMaster: ProductMasterEntry[] = [
    { id: 'ABC123' },
    { id: 'DEF456' }
  ]

  it('productId existe en productMaster → válido', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ABC123', quantity: 5 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(0)
    expect(result.valid[0].productId).toBe('ABC123')
    expect(result.summary.totalRows).toBe(1)
    expect(result.summary.validCount).toBe(1)
    expect(result.summary.invalidCount).toBe(0)
    expect(result.summary.errorBreakdown.INVALID_PRODUCT).toBe(0)
    expect(result.summary.errorBreakdown.INVALID_WAREHOUSE).toBe(0)
    expect(result.summary.errorBreakdown.MISSING_FIELD).toBe(0)
    expect(result.summary.errorBreakdown.INVALID_FORMAT).toBe(0)
  })

  it('productId NO existe → inválido con reason INVALID_PRODUCT', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ZZZ999', quantity: 5 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toBe('INVALID_PRODUCT')
    expect(result.summary.totalRows).toBe(1)
    expect(result.summary.validCount).toBe(0)
    expect(result.summary.invalidCount).toBe(1)
    expect(result.summary.errorBreakdown.INVALID_PRODUCT).toBe(1)
  })

  it('mezcla de válidos e inválidos por producto inexistente', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ABC123', quantity: 5 },
      { warehouse: 'miami', productId: 'ZZZ999', quantity: 5 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(1)
    expect(result.valid[0].productId).toBe('ABC123')
    expect(result.invalid[0].reason).toBe('INVALID_PRODUCT')
    expect(result.summary.totalRows).toBe(2)
    expect(result.summary.validCount).toBe(1)
    expect(result.summary.invalidCount).toBe(1)
    expect(result.summary.errorBreakdown.INVALID_PRODUCT).toBe(1)
  })
  it('row válida', () => {
    const rows: RawImportRow[] = [
      { warehouse: ' miami ', productId: 'ABC123', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(0)
    expect(result.valid[0].warehouse).toBe('MIAMI')
    expect(result.summary.totalRows).toBe(1)
    expect(result.summary.validCount).toBe(1)
    expect(result.summary.invalidCount).toBe(0)
  })

  it('warehouse vacío → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: '   ', productId: 'ABC123', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toBe('INVALID_WAREHOUSE')
    expect(result.summary.errorBreakdown.INVALID_WAREHOUSE).toBe(1)
  })

  it('productId vacío → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: '', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toBe('MISSING_FIELD')
    expect(result.summary.errorBreakdown.MISSING_FIELD).toBe(1)
  })

  it('quantity <= 0 → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ABC123', quantity: 0 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toBe('INVALID_FORMAT')
    expect(result.summary.errorBreakdown.INVALID_FORMAT).toBe(1)
  })

  it('mezcla de válidos e inválidos', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ABC123', quantity: 10 },
      { warehouse: '', productId: 'ABC123', quantity: 10 },
      { warehouse: 'miami', productId: '', quantity: 10 },
      { warehouse: 'miami', productId: 'ABC123', quantity: -5 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(3)
    expect(result.valid[0].warehouse).toBe('MIAMI')
    expect(result.summary.totalRows).toBe(4)
    expect(result.summary.validCount).toBe(1)
    expect(result.summary.invalidCount).toBe(3)
    expect(result.summary.errorBreakdown.INVALID_WAREHOUSE).toBe(1)
    expect(result.summary.errorBreakdown.MISSING_FIELD).toBe(1)
    expect(result.summary.errorBreakdown.INVALID_FORMAT).toBe(1)
  })
})
