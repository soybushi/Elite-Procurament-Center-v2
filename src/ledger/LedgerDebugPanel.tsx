/* ------------------------------------------------------------------ */
/*  Ledger Debug Panel — Internal developer tool                      */
/*  NOT wired into App.tsx or any route. Import manually to inspect.  */
/* ------------------------------------------------------------------ */

import { useState } from 'react';
import { ledgerStore } from './ledgerStore';
import {
  getBalanceBySku,
  getSkuKardex,
  getWarehouseSummary,
} from './ledgerInspector';
import type { KardexEntry, WarehouseSummary } from './ledgerInspector';

/* ------------------------------------------------------------------ */
/*  Inline styles (scoped — no global CSS changes)                    */
/* ------------------------------------------------------------------ */

const S = {
  root: {
    fontFamily: 'monospace',
    fontSize: 13,
    padding: 16,
    maxWidth: 820,
    background: '#1a1a2e',
    color: '#e0e0e0',
    borderRadius: 8,
    border: '1px solid #333',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px',
    fontSize: 16,
    color: '#7fdbca',
  } as React.CSSProperties,
  label: {
    display: 'inline-block',
    width: 110,
    color: '#aaa',
  } as React.CSSProperties,
  input: {
    background: '#0d0d1a',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: 4,
    padding: '4px 8px',
    marginRight: 8,
    width: 180,
  } as React.CSSProperties,
  btn: {
    background: '#264653',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: 4,
    padding: '5px 14px',
    cursor: 'pointer',
    marginRight: 6,
  } as React.CSSProperties,
  section: {
    marginTop: 16,
    padding: 10,
    background: '#0d0d1a',
    borderRadius: 6,
    border: '1px solid #222',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: 8,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    borderBottom: '1px solid #444',
    padding: '4px 8px',
    color: '#7fdbca',
  } as React.CSSProperties,
  td: {
    padding: '3px 8px',
    borderBottom: '1px solid #222',
  } as React.CSSProperties,
  muted: { color: '#666' } as React.CSSProperties,
  badge: (color: string) =>
    ({
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 3,
      fontSize: 11,
      background: color,
      color: '#fff',
    }) as React.CSSProperties,
};

const TYPE_COLORS: Record<string, string> = {
  receipt: '#2a9d8f',
  issue: '#e76f51',
  adjustment: '#e9c46a',
  transfer: '#264653',
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function LedgerDebugPanel() {
  const [sku, setSku] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const [balance, setBalance] = useState<{ sku: string; warehouseId: string; balance: number } | null>(null);
  const [kardex, setKardex] = useState<KardexEntry[]>([]);
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [totalMovements, setTotalMovements] = useState<number>(0);

  function handleQuery() {
    const state = ledgerStore.getState();
    setTotalMovements(state.movements.length);

    if (sku.trim() && warehouseId.trim()) {
      setBalance(getBalanceBySku(sku.trim(), warehouseId.trim()));
      setKardex(getSkuKardex(sku.trim(), warehouseId.trim()));
    } else {
      setBalance(null);
      setKardex([]);
    }

    if (warehouseId.trim()) {
      setSummary(getWarehouseSummary(warehouseId.trim()));
    } else {
      setSummary(null);
    }
  }

  function handleReset() {
    setBalance(null);
    setKardex([]);
    setSummary(null);
    setTotalMovements(0);
  }

  return (
    <div style={S.root}>
      <h3 style={S.heading}>🔍 Ledger Debug Panel</h3>

      {/* ---- Inputs ---- */}
      <div style={{ marginBottom: 10 }}>
        <span style={S.label}>SKU</span>
        <input
          style={S.input}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="e.g. E-1001"
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={S.label}>Warehouse ID</span>
        <input
          style={S.input}
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          placeholder="e.g. ELITE MIAMI"
        />
      </div>
      <div>
        <button style={S.btn} onClick={handleQuery}>
          Query
        </button>
        <button style={{ ...S.btn, background: '#555' }} onClick={handleReset}>
          Reset
        </button>
        <span style={{ ...S.muted, marginLeft: 12 }}>
          Store: {totalMovements} movement(s) loaded
        </span>
      </div>

      {/* ---- Balance ---- */}
      {balance !== null && (
        <div style={S.section}>
          <strong style={{ color: '#7fdbca' }}>Balance</strong>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>SKU</th>
                <th style={S.th}>Warehouse</th>
                <th style={S.th}>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>{balance.sku}</td>
                <td style={S.td}>{balance.warehouseId}</td>
                <td style={S.td}>{balance.balance}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Kardex ---- */}
      {kardex.length > 0 && (
        <div style={S.section}>
          <strong style={{ color: '#7fdbca' }}>
            Kardex ({kardex.length} entries)
          </strong>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>occurredAt</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Qty</th>
                <th style={S.th}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {kardex.map((entry, i) => (
                <tr key={i}>
                  <td style={S.td}>{entry.occurredAt}</td>
                  <td style={S.td}>
                    <span style={S.badge(TYPE_COLORS[entry.type] ?? '#555')}>
                      {entry.type}
                    </span>
                  </td>
                  <td style={S.td}>{entry.qty}</td>
                  <td style={S.td}>{entry.runningBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Warehouse Summary ---- */}
      {summary !== null && (
        <div style={S.section}>
          <strong style={{ color: '#7fdbca' }}>Warehouse Summary</strong>
          <table style={S.table}>
            <tbody>
              <tr>
                <td style={S.td}>Total Movements</td>
                <td style={S.td}>{summary.totalMovements}</td>
              </tr>
              <tr>
                <td style={S.td}>Receipts</td>
                <td style={S.td}>{summary.totalReceipts}</td>
              </tr>
              <tr>
                <td style={S.td}>Issues</td>
                <td style={S.td}>{summary.totalIssues}</td>
              </tr>
              <tr>
                <td style={S.td}>Adjustments</td>
                <td style={S.td}>{summary.totalAdjustments}</td>
              </tr>
              <tr>
                <td style={S.td}>Transfers In</td>
                <td style={S.td}>{summary.totalTransfersIn}</td>
              </tr>
              <tr>
                <td style={S.td}>Transfers Out</td>
                <td style={S.td}>{summary.totalTransfersOut}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
