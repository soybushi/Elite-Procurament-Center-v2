/* ------------------------------------------------------------------ */
/*  System Config — Global runtime configuration                      */
/*  NOT connected to ledger, UI or any existing module yet.           */
/* ------------------------------------------------------------------ */

import { DEFAULT_COMPANY } from './defaultCompany';

export interface SystemConfig {
  companyId: string;
  cutoverDateISO: string | null;
  baselineLoaded: boolean;
  createdAt: string;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  companyId: DEFAULT_COMPANY.id,
  cutoverDateISO: null,
  baselineLoaded: false,
  createdAt: new Date().toISOString(),
};
