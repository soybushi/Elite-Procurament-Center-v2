# AUDITORÍA FASE 1–3 — Reporte de Cumplimiento

> Generado por herramienta automatizada configurable (solo lectura).
> Rama: chore/audit-fase4-master-alignment

## FASE 1 — Core Engine Foundation
- Stores: purchaseRequestStore (ef-reqs), purchaseOrderStore (ef-pos), ledgerStore (ef-ledger), transferStore (ef-transfers), auditStore (ef-audit) — todos en IndexedDB via idbStorage.
- Services: PR/PO/Transfer/Ledger services presentes.
- PR state machine: transición inválida lanza error.
- Ledger inmutable: cutover + baseline guards.
- PR→PO idempotente: guard contra doble conversión.

## FASE 2 — Security & Tenancy
- Actor model: getActor() -> ACTOR_REQUIRED; role string; companyId presente.
- Policy engine: default deny; assertCan -> POLICY_DENY:<action>; POLICY_PRESETS en /config.
- Enforcement: puntos mutantes usan getActor()+assertCan().

## FASE 3 — PR Domain Convergence
- purchaseRequestStore persistido en IDB.
- updatePurchaseRequest enforced: version++, audit log, immutable guards.
- UI PurchaseOrders.tsx: NO bypass UI→store.

## GAPS (no-bloqueantes, a decisión de Mind AUD)
- G1 (Media): Transfer FSM no enforced en service layer (updateTransfer sin guard).
- G2 (Baja): utilities internas de ledger sin policy guard (API interna).
- G3 (Media): cobertura de tests limitada para criterios Fase 1–3.
- G4 (Media): applyImportBatch sin tests (deny viewer DATA_IMPORT / allow admin).

