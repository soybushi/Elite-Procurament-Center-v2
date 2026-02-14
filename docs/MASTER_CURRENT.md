# FASE 2 – SECURITY & TENANCY FOUNDATION (COMPLETED)

## Actor Model

- Actor obligatorio en toda operación mutante
- `getActor()` lanza `ACTOR_REQUIRED`
- Actor incluye `userId`, `role`, `companyId`

## Policy Enforcement

- `assertCan()` en PurchaseRequest services
- `assertCan()` en Ledger service
- POLICY matrix centralizada en `policyEngine`
- UI no tiene acceso directo a policy

## Ledger Enforcement

- `moveIn` → `LEDGER_MOVE_IN`
- `moveOut` → `LEDGER_MOVE_OUT`
- `adjust` → `LEDGER_ADJUST`
- `createdBy` estampado desde actor

## Tenancy Preparation

- `CompanyId` introducido como tipo central
- Actor propaga `companyId`
- `PurchaseRequest`, `PurchaseOrder` y `Movement` incluyen `companyId`
- No multi-tenant real aún (solo preparación estructural)

## Domain Corrections

- Unificación de modelo de status a inglés canónico
- Corrección de firma `convertApprovedRequestToPurchaseOrder`
- Eliminación de modelo dual español/inglés

## Current Guarantees

- No mutación directa de stores fuera de services
- No dependencias circulares
- `tsc --noEmit` limpio
- `npm run build` limpio
