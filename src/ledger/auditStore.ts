/* ------------------------------------------------------------------ */
/*  Audit Store — Minimal in-memory store for AuditLog entries        */
/*  NOT connected to UI or existing modules.                          */
/* ------------------------------------------------------------------ */

import type { AuditLog } from '../types';

export interface AuditState {
  logs: AuditLog[];
}

const state: AuditState = {
  logs: [],
};

export const auditStore = {
  getState(): AuditState {
    return state;
  },
  addLog(log: AuditLog): void {
    state.logs.push(log);
  },
  addLogs(logs: AuditLog[]): void {
    state.logs.push(...logs);
  },
  reset(): void {
    state.logs = [];
  },
} as const;
