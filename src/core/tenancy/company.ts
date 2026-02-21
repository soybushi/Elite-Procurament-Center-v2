/* ------------------------------------------------------------------ */
/*  Tenancy — Company identification types                            */
/*  Foundation for future multi-tenant support.                       */
/*  No runtime behaviour — pure type definitions.                     */
/* ------------------------------------------------------------------ */

/** Opaque company identifier. */
export type CompanyId = string;

/** Minimal company entity. */
export interface Company {
  id: CompanyId;
  name: string;
}
