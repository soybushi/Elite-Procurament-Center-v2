import { describe, it, expect } from 'vitest'
import { normalizeWarehouseName } from '../warehouseNormalizer'

describe('normalizeWarehouseName', () => {
  it('normaliza "Miami"', () => {
    expect(normalizeWarehouseName('Miami')).toBe('MIAMI')
  })
  it('normaliza " miami "', () => {
    expect(normalizeWarehouseName(' miami ')).toBe('MIAMI')
  })
  it('normaliza "ELITE MIAMI"', () => {
    expect(normalizeWarehouseName('ELITE MIAMI')).toBe('MIAMI')
  })
  it('normaliza "Elite-Miami"', () => {
    expect(normalizeWarehouseName('Elite-Miami')).toBe('MIAMI')
  })
  it('normaliza "miami warehouse"', () => {
    expect(normalizeWarehouseName('miami warehouse')).toBe('MIAMI')
  })
  it('normaliza " ELITE   miami   warehouse "', () => {
    expect(normalizeWarehouseName(' ELITE   miami   warehouse ')).toBe('MIAMI')
  })
  it('normaliza string vacío', () => {
    expect(normalizeWarehouseName('')).toBe('')
  })
  it('normaliza solo espacios', () => {
    expect(normalizeWarehouseName('   ')).toBe('')
  })
})
