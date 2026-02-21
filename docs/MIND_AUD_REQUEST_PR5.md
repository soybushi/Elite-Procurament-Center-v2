# Solicitud formal de auditoría — PR #5

| Campo | Valor |
|-------|-------|
| **PR** | #5 — "Phase 4 master alignment: integrate core + close G1 blocker" |
| **URL** | https://github.com/soybushi/Elite-Procurament-Center-v2/pull/5 |
| **Rama** | `chore/audit-fase4-master-alignment` |
| **Base** | `main` |
| **Estado** | OPEN · Ready for review (no Draft) |
| **Fecha** | 2026-02-21 |

---

## 1. Objetivo de la auditoría

Solicitar emisión formal de **GO / NO-GO** para merge de PR #5 a `main`.

El PR cierra los blockers B1, B2 y B3 reportados por Mind AUD en la revisión anterior,
e incorpora la alineación completa con el master plan de FASE 4.
La presente solicitud aporta evidencia reproducible de cada corrección.

---

## 2. Scope exacto a auditar

### 2.1 Pipeline obligatorio (sin bypass UI → store)

**Invariante:** toda operación de dominio debe recorrer el pipeline completo:

```
Actor (getActor)
  → Policy (assertCan)
    → Service (lógica de dominio)
      → Store facade (actualización de estado)
        → auditStore.addLog (registro de auditoría)
```

Ningún componente UI debe llamar directamente a métodos de store que muten estado
sin pasar por el service layer con validación de policy.

**Archivos clave:**
- `src/stores/authStore.ts` — `getActor()` (lanza `ACTOR_REQUIRED` si no hay actor)
- `src/core/security/policyEngine.ts` — `assertCan()` (lanza `POLICY_DENY:<action>`)
- `src/config/policyPresets.ts` — mapa `role → Action[]` (default deny)
- `src/ledger/purchaseRequestService.ts` — pipeline PR
- `src/ledger/transferService.ts` — pipeline Transfer
- `src/ledger/ledgerService.ts` — pipeline Ledger
- `src/ledger/auditStore.ts` — registro inmutable de auditoría

### 2.2 Persistencia: Zustand + IndexedDB (no localStorage writes)

**Invariante:** toda persistencia activa de stores de dominio va exclusivamente a
IndexedDB mediante el middleware `persist` de Zustand con `idbStorage` (localforage).
La UI **no debe escribir** a `localStorage` ni `sessionStorage` en ningún path activo.

Las únicas referencias a `localStorage.getItem` permitidas son lecturas de bootstrap
de un solo uso al inicializar el componente raíz o al montar stores legacy.

**Stores de dominio y claves IDB:**

| Store | Clave IDB | Archivo |
|-------|-----------|---------|
| `useAuditStore` | `ef-audit` | `src/ledger/auditStore.ts` |
| `usePurchaseRequestStore` | `ef-reqs` | `src/ledger/purchaseRequestStore.ts` |
| `usePurchaseOrderStore` | `ef-pos` | `src/ledger/purchaseOrderStore.ts` |
| `useLedgerStore` | `ef-ledger` | `src/ledger/ledgerStore.ts` |
| `useTransferStore` | `ef-transfers` | `src/ledger/transferStore.ts` |

**Archivo de abstracción IDB:** `src/infra/idbStorage.ts`

### 2.3 Warehouse: uso de `warehouseId` real

**Invariante:** las operaciones de inventario y transfer deben referenciar
`warehouseId` (identificador canónico del master de bodegas), no el nombre
como clave arbitraria.

**Archivos clave:**
- `src/config/warehouseMaster.ts` / `src/data/warehouseMaster.ts`
- `src/utils/warehouseNormalizer.ts`
- `src/ledger/ledgerService.ts`

### 2.4 Import: `DATA_IMPORT` + audit + `warehouseId` real

**Invariante:** el batch de importación debe:
1. Requerir la acción de seguridad `DATA_IMPORT` (verificada vía `assertCan`).
2. Registrar una entrada de auditoría con entidad `data_import`.
3. Usar `warehouseId` real (no nombre) al procesar ítems de inventario.

**Archivos clave:**
- `src/ledger/applyImportBatch.ts`
- `src/import/parser/importParser.ts`
- `src/core/security/actions.ts` (contiene `DATA_IMPORT`)

### 2.5 PR Domain: inmutabilidad de campos críticos + auditoría

**Invariante:** los campos `companyId`, `warehouseId` y `version` de un
`PurchaseRequest` son inmutables después de su creación. Cada mutación de
estado incrementa `version` y genera entrada en `auditStore`.

**Archivos clave:**
- `src/ledger/purchaseRequestService.ts`
- `src/ledger/purchaseRequestCreationService.ts`
- `src/ledger/purchaseRequestConversionService.ts`
- `src/ledger/types.ts`

### 2.6 Transfer: status canónico `'draft'` + no bypass UI → store

**Invariante:** el estado inicial de un Transfer es `'draft'`. Los cambios de
estado pasan por `transferService` con validación de policy; la UI no llama
directamente a métodos de store que muten el estado del Transfer.

**Archivos clave:**
- `src/ledger/transferService.ts`
- `src/ledger/transferStore.ts`

### 2.7 B1/G1 cerrado: `under_review` requiere `assertCan(PR_UPDATE)` + tests

**Invariante (post-fix):** `transitionPurchaseRequestStatus` ejecuta
`assertCan(actor, 'PR_UPDATE')` cuando el estado destino es `under_review`.
Ningún estado writable puede omitirse en `STATUS_ACTION_MAP`.

**Archivo:** `src/ledger/purchaseRequestService.ts:90-95`

```typescript
const STATUS_ACTION_MAP: Partial<Record<PurchaseRequestStatus, Action>> = {
  submitted:    'PR_SUBMIT',
  under_review: 'PR_UPDATE',   // cerrado B1/G1
  approved:     'PR_APPROVE',
  rejected:     'PR_REJECT',
  // 'converted': ausente — gateado por PR_CONVERT_TO_PO en conversionService
};
```

---

## 3. Evidencia reproducible

### 3.1 Comandos y resultados (replicables en cualquier entorno)

```bash
# Posicionarse en la rama
git checkout chore/audit-fase4-master-alignment

# Gate 1: verificación de tipos
npm run typecheck
# Resultado esperado: 0 errores (exit 0)

# Gate 2: suite de pruebas
npx vitest run
# Resultado esperado: 20/20 tests, 3 archivos (exit 0)

# Gate 3: build de producción
npm run build
# Resultado esperado: "✓ built in Xs" (exit 0)

# Seguridad B3: confirmar 0 writes a localStorage/sessionStorage
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" src || true
# Resultado esperado: sin output (exit 1, 0 coincidencias)

rg -n "window\.(localStorage|sessionStorage)\." src || true
# Resultado esperado: solo líneas getItem (bootstrap read-only)

# Seguridad B1: confirmar under_review en STATUS_ACTION_MAP
grep -n "under_review" src/ledger/purchaseRequestService.ts
# Resultado esperado: under_review: 'PR_UPDATE',
```

### 3.2 Resultados obtenidos al momento de esta solicitud (2026-02-21)

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | ✅ 0 errores |
| `npx vitest run` | ✅ 20/20 — 3 archivos (`purchaseRequestService` 4, `importParser` 8, `warehouseNormalizer` 8) |
| `npm run build` | ✅ `built in 7.34s` |
| localStorage writes (`setItem/removeItem/clear`) | ✅ 0 coincidencias (exit 1) |
| `window.localStorage.*` | ✅ 4 líneas — todas `getItem` (bootstrap read-only, ver tabla §2.2) |
| `under_review` en `STATUS_ACTION_MAP` | ✅ línea 92 — `under_review: 'PR_UPDATE'` |

### 3.3 Lecturas bootstrap read-only restantes (clasificación completa)

| Archivo | Línea | Clave | Tipo |
|---------|-------|-------|------|
| `src/App.tsx` | 30 | `ef-whs` | Bootstrap one-time al montar (read-only) |
| `src/App.tsx` | 62 | `ef-inv` | Bootstrap one-time al montar (read-only) |
| `src/App.tsx` | 72 | `ef-hist` | Bootstrap one-time al montar (read-only) |
| `src/ledger/transferStore.ts` | 21 | `ef-transfers` | Bootstrap de migración legacy (read-only si IDB vacío) |
| `src/ledger/ledgerStore.ts` | 31 | `ef-ledger` | Bootstrap de migración legacy (read-only si IDB vacío) |
| `src/ledger/purchaseOrderStore.ts` | 28 | `ef-pos` | Bootstrap de migración legacy (read-only si IDB vacío) |
| `src/ledger/purchaseRequestStore.ts` | 21 | `ef-reqs` | Bootstrap de migración legacy (read-only si IDB vacío) |

Todas son `getItem` de uso único en inicialización. Ninguna escribe de vuelta
a `localStorage`. Comentario explícito en `src/App.tsx:84-86`:

```typescript
// legacy bootstrap read-only; DO NOT write to localStorage (B3)
// whs/inv/hist are seeded from localStorage once on mount (getItem above).
// Ongoing persistence is handled by Zustand stores via IndexedDB (idbStorage).
```

---

## 4. Cambios recientes relevantes (commits que cierran B1/B2/B3)

| Hash | Blocker | Descripción |
|------|---------|-------------|
| `311f8dc` | B1 + B2 | Agrega `under_review: 'PR_UPDATE'` a `STATUS_ACTION_MAP`; crea 4 tests de enforcement de policy en `purchaseRequestService.test.ts` |
| `81e7b75` | B3 | Elimina 3 bloques `useEffect` con `localStorage.setItem` de `src/App.tsx`; convierte `reqs`/`tr` a referencias directas de stores Zustand |
| `a74f771` | B3 docs | Evidencia específica B3: clasificación de reads, arquitectura IDB, comandos reproducibles |
| `857a499` | B1+B2+B3 docs | Evidencia unificada en `docs/MIND_AUD_EVIDENCE_PR5.md` |

Evidencia detallada completa: [`docs/MIND_AUD_EVIDENCE_PR5.md`](MIND_AUD_EVIDENCE_PR5.md)
Evidencia específica B3: [`docs/MIND_AUD_EVIDENCE_B3.md`](MIND_AUD_EVIDENCE_B3.md)

---

## 5. Gaps no-bloqueantes propuestos como backlog

Los siguientes gaps fueron identificados en el reporte de auditoría de FASE 1–3
y se proponen como backlog (no-bloqueantes para el merge de PR #5):

| Gap | Descripción | Severidad propuesta |
|-----|-------------|---------------------|
| G2 | Internals de `ledgerStore` sin cobertura de test aislada | Baja |
| G3 | Cobertura de tests insuficiente en `applyImportBatch` | Media |
| G4 | `applyImportBatch` sin tests de audit entity `data_import` | Media |

Se solicita confirmación explícita de que G2, G3 y G4 quedan como backlog
y no bloquean el merge.

---

## 6. Solicitud de salida (respuesta obligatoria)

Mind AUD debe responder a esta solicitud con:

1. **GO** para merge a `main` — si todos los criterios del scope (§2) se cumplen.
2. **NO-GO** — si se identifican nuevos blockers; en ese caso incluir:
   - Blocker ID (Bx o Gx)
   - Archivo y línea exacta
   - Fix mínimo requerido
3. **Confirmación** de que G2, G3 y G4 quedan como backlog no-bloqueante (o reclasificación justificada si aplica).

---

*Para reproducir toda la evidencia: clonar la rama `chore/audit-fase4-master-alignment` y ejecutar los comandos del §3.1.*
