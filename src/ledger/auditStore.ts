/* ------------------------------------------------------------------ */
/*  Audit Store — Persisted to IndexedDB under key "ef-audit"         */
/* ------------------------------------------------------------------ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuditLog } from '../types';
import { idbStorage } from '../infra/idbStorage';

export interface AuditState {
  logs: AuditLog[];
  addLog: (log: AuditLog) => void;
  addLogs: (logs: AuditLog[]) => void;
  reset: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
      addLogs: (logs) => set((state) => ({ logs: [...state.logs, ...logs] })),
      reset: () => set({ logs: [] }),
    }),
    {
      name: 'ef-audit',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ logs: state.logs }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Backward-compatible facade (consumed by existing services)        */
/* ------------------------------------------------------------------ */

/**
 * ⚠ INTERNAL DOMAIN STORE
 * DO NOT IMPORT THIS DIRECTLY FROM UI LAYER.
 * All mutations must go through service functions.
 */
export const auditStore = {
  getState(): Pick<AuditState, 'logs'> {
    return { logs: useAuditStore.getState().logs };
  },
  addLog(log: AuditLog): void {
    useAuditStore.getState().addLog(log);
  },
  addLogs(logs: AuditLog[]): void {
    useAuditStore.getState().addLogs(logs);
  },
  reset(): void {
    useAuditStore.getState().reset();
  },
} as const;
