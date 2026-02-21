import type { Warehouse } from '../types';

export const WAREHOUSE_MASTER: readonly Warehouse[] = [
  { id: 'WH-001', name: 'BAY STATE', state: 'Massachusetts', stateCode: 'MA', type: 'flowers', status: 'active' },
  { id: 'WH-002', name: 'ELITE CALIFORNIA', state: 'California', stateCode: 'CA', type: 'flowers', status: 'active' },
  { id: 'WH-003', name: 'ELITE HARDGOODS MIAMI', state: 'Florida', stateCode: 'FL', type: 'hardgoods', status: 'active' },
  { id: 'WH-004', name: 'ELITE HARDGOODS 290', state: 'Florida', stateCode: 'FL', type: 'hardgoods', status: 'active' },
  { id: 'WH-005', name: 'ELITE LEBANON TN', state: 'Tennessee', stateCode: 'TN', type: 'flowers', status: 'active' },
  { id: 'WH-006', name: 'ELITE MIAMI', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-007', name: 'ELITE MIAMI - SNB', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-008', name: 'ELITE MIAMI 120', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-009', name: 'ELITE MIAMI 250', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-010', name: 'ELITE MIAMI 280', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-011', name: 'ELITE MIAMI 290', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-012', name: 'ELITE MIAMI 340', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-013', name: 'ELITE MIAMI 725', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-014', name: 'ELITE MIAMI CAFETERÍA', state: 'Florida', stateCode: 'FL', type: 'cafeteria', status: 'active' },
  { id: 'WH-015', name: 'ELITE MIAMI SHIPPING', state: 'Florida', stateCode: 'FL', type: 'shipping', status: 'active' },
  { id: 'WH-016', name: 'ELITE MIAMI SISTER CO.', state: 'Florida', stateCode: 'FL', type: 'flowers', status: 'active' },
  { id: 'WH-017', name: 'ELITE NEW JERSEY', state: 'New Jersey', stateCode: 'NJ', type: 'flowers', status: 'active' },
  { id: 'WH-018', name: 'ELITE TEXAS', state: 'Texas', stateCode: 'TX', type: 'flowers', status: 'active' },
  { id: 'WH-019', name: 'ELITE USA BQT IL', state: 'Illinois', stateCode: 'IL', type: 'bouquets', status: 'active' },
  { id: 'WH-020', name: 'ELITE WASHINGTON', state: 'Washington', stateCode: 'WA', type: 'flowers', status: 'active' },
  { id: 'WH-021', name: 'USA BQT MIAMI', state: 'Florida', stateCode: 'FL', type: 'bouquets', status: 'active' },
] as const;

const COLLAPSE_SPACE_RE = /\s+/g;
const BASIC_PUNCTUATION_RE = /[.,;:()[\]{}"'`]/g;
const DIACRITICS_RE = /[\u0300-\u036f]/g;

export function normalizeWarehouseInput(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(BASIC_PUNCTUATION_RE, ' ')
    .replace(COLLAPSE_SPACE_RE, ' ')
    .trim();
}

const WAREHOUSE_NAME_TO_ID = new Map<string, string>(
  WAREHOUSE_MASTER.map((warehouse) => [normalizeWarehouseInput(warehouse.name), warehouse.id]),
);

const WAREHOUSE_ALIAS_TO_ID: Record<string, string> = {
  [normalizeWarehouseInput('ELITE MIAMI -  SNB')]: 'WH-007',
  [normalizeWarehouseInput('ELITE LEBANON, TN')]: 'WH-005',
  [normalizeWarehouseInput('Elite Hardgoods Miami')]: 'WH-003',
};

export function resolveWarehouseId(input: string): string | null {
  const normalized = normalizeWarehouseInput(input);
  if (!normalized) return null;
  return WAREHOUSE_NAME_TO_ID.get(normalized) ?? WAREHOUSE_ALIAS_TO_ID[normalized] ?? null;
}

export function getWarehouseById(id: string): Warehouse | undefined {
  return WAREHOUSE_MASTER.find((warehouse) => warehouse.id === id);
}

export function getWarehouseByName(name: string): Warehouse | undefined {
  const warehouseId = resolveWarehouseId(name);
  if (!warehouseId) return undefined;
  return getWarehouseById(warehouseId);
}
