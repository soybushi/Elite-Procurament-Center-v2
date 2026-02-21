import { describe, it, expect } from 'vitest'
import { normalizeWarehouseInput, resolveWarehouseId } from '../warehouseNormalizer'

describe('normalizeWarehouseInput', () => {
  it('normaliza "Miami"', () => {
    expect(normalizeWarehouseInput('Miami')).toBe('MIAMI')
  })
  it('normaliza " miami "', () => {
    expect(normalizeWarehouseInput(' miami ')).toBe('MIAMI')
  })
  it('conserva tokens de identidad', () => {
    expect(normalizeWarehouseInput('ELITE MIAMI')).toBe('ELITE MIAMI')
  })
  it('normaliza "Elite-Miami"', () => {
    expect(normalizeWarehouseInput('Elite-Miami')).toBe('ELITE-MIAMI')
  })
  it('normaliza string vacío', () => {
    expect(normalizeWarehouseInput('')).toBe('')
  })
  it('normaliza solo espacios', () => {
    expect(normalizeWarehouseInput('   ')).toBe('')
  })
})

describe('resolveWarehouseId', () => {
  it('resuelve id canonical', () => {
    expect(resolveWarehouseId('ELITE MIAMI')).toBe('WH-006')
  })
  it('retorna null en warehouse desconocido', () => {
    expect(resolveWarehouseId('WAREHOUSE INEXISTENTE')).toBeNull()
  })
})
