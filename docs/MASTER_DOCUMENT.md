# MASTER DOCUMENT -- Elite Procurement Center v2

> Documento canonico y fuente de verdad arquitectonica del proyecto.
> Todo criterio de aceptacion, invariante y regla de diseño se define aqui.
> Revision: 2026-02-21 | Estado: VIGENTE

---

## Precedencia

Este documento (`docs/MASTER_DOCUMENT.md`) es el **unico master canonico** del proyecto.
`docs/MASTER_CURRENT.md` es un resumen/snapshot derivado y no tiene precedencia sobre este documento.
En caso de conflicto, este documento prevalece.

---

## Pipeline Arquitectonico Central

Toda operacion mutante del sistema sigue el siguiente pipeline sin excepcion:

```
Actor (autenticado)
  --> getActor()        [authStore -- lanza ACTOR_REQUIRED si no hay actor]
  --> assertCan()       [policyEngine -- lanza POLICY_DENY:<action> si denegado]
  --> Service function  [unica puerta de mutacion]
  --> Store facade      [internal domain store -- nunca desde UI]
  --> auditStore.addLog [registro de auditoria obligatorio]
```

**Invariante absoluta:** ningun componente de UI puede mutar un store directamente.
Toda escritura pasa por la capa de servicios.

---

## FASE 1 -- Core Engine Foundation

### 1.1 Stores de Dominio

Cinco stores conforman la capa de persistencia. Todos cumplen:
- Implementados con Zustand + middleware `persist`
- Almacenados en IndexedDB via `idbStorage` (localforage)
- `partialize` serializa solo datos, no funciones Zustand
- Exponen un hook reactivo (`useXxxStore`) para lectura en UI
- Exponen una facade interna (`xxxStore`) marcada con advertencia para uso exclusivo de services

| Store | Key IDB | Hook UI | Facade interna |
|---|---|---|---|
| purchaseRequestStore | `ef-reqs` | `usePurchaseRequestStore` | `purchaseRequestStore` |
| purchaseOrderStore | `ef-pos` | `usePurchaseOrderStore` | `purchaseOrderStore` |
| ledgerStore | `ef-ledger` | `useLedgerStore` | `ledgerStore` |
| transferStore | `ef-transfers` | `useTransferStore` | `transferStore` |
| auditStore | `ef-audit` | `useAuditStore` | `auditStore` |

### 1.2 Servicios Mutantes

Cada servicio es la unica puerta de escritura a su store correspondiente.
Ningun otro modulo puede invocar metodos de mutacion directamente.

| Servicio | Operaciones |
|---|---|
| purchaseRequestCreationService | `createPurchaseRequest()` |
| purchaseRequestService | `transitionPurchaseRequestStatus()`, `updatePurchaseRequest()` |
| purchaseRequestConversionService | `convertApprovedRequestToPurchaseOrder()`, `convertApprovedRequestToPO()` |
| purchaseOrderService | `createPurchaseOrder()` |
| transferService | `createTransfer()`, `updateTransfer()` |
| ledgerService | `moveIn()`, `moveOut()`, `adjust()` |

### 1.3 Maquina de Estados -- PurchaseRequest

Transiciones permitidas (definidas en `PURCHASE_REQUEST_TRANSITIONS`):

```
draft        --> [submitted]
submitted    --> [under_review, rejected]
under_review --> [approved, rejected, draft]
approved     --> [converted]
rejected     --> [draft]
converted    --> []   (estado terminal)
```

Invariantes:
- `canTransition(from, to)` debe retornar `true` antes de cualquier transicion
- Transicion invalida lanza: `Invalid status transition from '<from>' to '<to>'.`
- El estado `converted` no tiene salida
- Cada transicion incrementa `version` y registra audit log

### 1.4 Ledger Inmutable

- `cutoverDateISO: string | null` en `DEFAULT_SYSTEM_CONFIG`
- `createMovementBase()` lanza `Movement date is before system cutover date. Operation blocked.` si `occurredAtISO < cutoverDateISO`
- `baselineLoaded: boolean` en `DEFAULT_SYSTEM_CONFIG`
- `applyInventoryBaseline()` lanza `Baseline already loaded. Operation blocked.` si ya fue cargado
- El baseline solo puede ejecutarse una vez; fija `cutoverDateISO` del primer item y marca `baselineLoaded = true`

### 1.5 Conversion PR to PO -- Idempotencia

- Guard de estado: solo PR en estado `approved` puede convertirse
- Guard de duplicado: `existsPurchaseOrderByNumber(request.id)` lanza `PurchaseRequest already converted to PurchaseOrder.`
- Idempotencia en retry: si `status === converted` y PO existe, retorna PO existente sin error
- Guard de race condition: segundo check de PO antes de delegar a la conversion

---

## FASE 2 -- Security & Tenancy Foundation

### 2.1 Actor Model

- `Actor` = `{ userId: string; role: string; companyId: CompanyId }`
- `role` es `string` (no union literal), extensible via `POLICY_PRESETS`
- `getActor()` en `authStore` lanza `Error('ACTOR_REQUIRED')` si no hay actor activo
- `setActor()` / `clearActor()` son las unicas formas de modificar el actor

### 2.2 Policy Engine

- `Action` es un union de 17 acciones auditables (incluyendo `DATA_IMPORT`)
- `POLICY_PRESETS` es `Record<string, Partial<Record<Action, boolean>>>` en `src/config/policyPresets.ts`
- `can(actor, action)`: retorna `false` (DENY) si el role no existe en POLICY_PRESETS
- `assertCan(actor, action)`: lanza `` Error(`POLICY_DENY:${action}`) `` si `can()` retorna false
- La policy reside exclusivamente en `/config`; la UI no tiene acceso a ella

### 2.3 Enforcement Obligatorio

Todo punto mutante (servicio que modifica estado) debe:
1. Llamar `getActor()` -- obtiene el actor autenticado o lanza
2. Llamar `assertCan(actor, action)` -- valida permisos o lanza

Puntos mutantes y sus acciones:

| Servicio / Funcion | Accion |
|---|---|
| createPurchaseRequest | PR_CREATE |
| transitionPurchaseRequestStatus | PR_SUBMIT / PR_APPROVE / PR_REJECT (segun STATUS_ACTION_MAP) |
| updatePurchaseRequest | PR_UPDATE |
| convertApprovedRequestToPurchaseOrder | PR_CONVERT_TO_PO |
| createPurchaseOrder | PO_CREATE |
| createTransfer | TRANSFER_CREATE |
| updateTransfer | TRANSFER_UPDATE |
| moveIn | LEDGER_MOVE_IN |
| moveOut | LEDGER_MOVE_OUT |
| adjust | LEDGER_ADJUST |
| applyEFlowerImportResultToLedger | DATA_IMPORT |

### 2.4 Tenancy

- `CompanyId` es un tipo central opaco
- Todo entity incluye `companyId` propagado desde el actor
- `createdBy` se estampa desde `actor.userId` en todo movimiento y solicitud

### 2.5 Correcciones de Dominio

- Modelo de status unificado en ingles canonico
- Eliminacion del modelo dual espanol/ingles
- Firma `convertApprovedRequestToPurchaseOrder` corregida

### 2.6 Garantias Vigentes (FASE 2)

- Sin mutacion directa de stores fuera de services
- Sin dependencias circulares
- `tsc --noEmit` limpio
- `npm run build` limpio

---

## FASE 3 -- PR Domain Convergence

### 3.1 Store de PurchaseRequest

- `purchaseRequestStore` implementado con Zustand + `persist`
- Key IDB: `ef-reqs` via `idbStorage`
- `partialize` incluye solo `purchaseRequests`
- Hook reactivo `usePurchaseRequestStore` para lectura en UI

### 3.2 updatePurchaseRequest -- Enforcement Completo

La funcion `updatePurchaseRequest(updated: PurchaseRequest)` implementa:

1. `getActor()` -- actor obligatorio
2. `assertCan(actor, 'PR_UPDATE')` -- policy enforcement
3. Verificacion de existencia -- lanza `PurchaseRequest not found.` si no existe
4. Guards de campos inmutables:
   - `id` no puede cambiar --> lanza `IMMUTABLE_FIELD:id`
   - `companyId` no puede cambiar --> lanza `IMMUTABLE_FIELD:companyId`
   - `warehouseId` no puede cambiar --> lanza `IMMUTABLE_FIELD:warehouseId`
5. `version` incrementado: `Math.max(current.version ?? 1, 1) + 1`
6. Audit log registrado con accion `updated`

### 3.3 UI -- Sin Bypass UI to Store

Invariante: ningun componente de UI importa ni llama directamente a la facade interna de ningun store.

- `PurchaseOrders.tsx` importa solo `usePurchaseRequestStore` (hook read-only)
- Todas las mutaciones en UI van via servicios: `createPurchaseRequest`, `updatePurchaseRequest`, `convertApprovedRequestToPO`
- `Transfers.tsx` importa solo `useTransferStore` (hook read-only) y llama `createTransfer`, `updateTransfer` de service

---

## Reglas No Negociables (AI/LUNO)

Las siguientes restricciones aplican a toda modificacion, humana o asistida por herramienta:

1. **Nunca modificar stores directamente.** Toda mutacion pasa por servicios oficiales.
2. **Nunca saltar servicios oficiales.** No se permiten wrappers paralelos ni mutaciones directas.
3. **Nunca evitar auditoria.** Toda operacion mutante genera registro en `auditStore`.
4. **Nunca evitar roles.** No se permiten bypasses de autorizacion ni hardcodeos de permisos.
5. **Build limpio obligatorio.** Ningun cambio se versiona si `npm run build` falla.
6. **Commit al cerrar bloque.** Cada bloque arquitectonico cerrado se versiona inmediatamente.
7. **Snapshot limpio antes de nueva fase.** La fase anterior debe estar 100% commiteada con build limpio.

---

## Governance de Fases

Toda idea, solicitud o cambio se clasifica antes de actuar:

| Categoria | Descripcion |
|---|---|
| Fase actual | Pertenece al bloque arquitectonico en curso |
| Estructural | Afecta cimientos (stores, tipos base, ledger) |
| Funcional | Mejora funcionalidad sin alterar estructura |
| Futura | No corresponde a fase activa; se agenda |

Tras clasificar, se decide: **implementar ahora / agendar / descartar**, con justificacion en una linea.

---

## Vigencia

Este documento entra en vigor el 2026-02-21 y es el unico master canonico del proyecto.
Toda modificacion a este documento debe ser versionada, justificada y registrada en `docs/DECISIONS_LOG.md`.
