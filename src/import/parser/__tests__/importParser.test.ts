import { describe, it, expect } from 'vitest'
import { parseImportRows, RawImportRow, ProductMasterEntry } from '../importParser'

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
  })

  it('productId NO existe → inválido con reason PRODUCT_NOT_FOUND', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ZZZ999', quantity: 5 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toBe('PRODUCT_NOT_FOUND')
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
    expect(result.invalid[0].reason).toBe('PRODUCT_NOT_FOUND')
  })
  it('row válida', () => {
    const rows: RawImportRow[] = [
      { warehouse: ' miami ', productId: 'ABC123', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(0)
    expect(result.valid[0].warehouse).toBe('MIAMI')
  })

  it('warehouse vacío → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: '   ', productId: 'ABC123', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toMatch(/warehouse/i)
  })

  it('productId vacío → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: '', quantity: 10 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toMatch(/productid/i)
  })

  it('quantity <= 0 → inválido', () => {
    const rows: RawImportRow[] = [
      { warehouse: 'miami', productId: 'ABC123', quantity: 0 }
    ]
    const result = parseImportRows(rows, productMaster)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(1)
    expect(result.invalid[0].reason).toMatch(/quantity/i)
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
    for (const inv of result.invalid) {
      expect(inv.reason.length).toBeGreaterThan(0)
    }
  })
})
