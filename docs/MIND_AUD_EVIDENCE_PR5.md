# Evidencia de Cierre — Mind AUD Blockers B1, B2, B3 (PR #5)

| Campo | Valor |
|-------|-------|
| **PR** | #5 — Phase 4 master alignment: integrate core + close G1 blocker |
| **Rama** | `chore/audit-fase4-master-alignment` |
| **Fecha de recolección** | 2026-02-21 |
| **Logs locales** | `.audit/pr5_typecheck.txt`, `.audit/pr5_test.txt`, `.audit/pr5_build.txt` |
| **Nota** | `.audit/` está en `.gitignore` y no se versiona |

---

## Resumen ejecutivo

Los tres blockers reportados por Mind AUD para PR #5 están cerrados:

| Blocker | Estado | Commit de corrección |
|---------|--------|---------------------|
| **B1** — `transitionPurchaseRequestStatus` sin `assertCan` para `under_review` | ✅ CERRADO | `311f8dc` |
| **B2** — Sin tests que verifiquen enforcement de policy | ✅ CERRADO | `311f8dc` |
| **B3** — UI escribía a `localStorage` (`setItem` en efectos) | ✅ CERRADO | `81e7b75` |

---

## B1 — Enforcement de política para `under_review`

### Qué se prohibía / problema

`transitionPurchaseRequestStatus` ejecutaba `assertCan` para `submitted`, `approved` y `rejected`, pero **no para `under_review`**, permitiendo que cualquier actor (incluso sin permisos) pudiera mover un PR a ese estado sin verificación de política.

### Corrección (`311f8dc`, `src/ledger/purchaseRequestService.ts:90-95`)

```typescript
const STATUS_ACTION_MAP: Partial<Record<PurchaseRequestStatus, Action>> = {
  submitted:    'PR_SUBMIT',
  under_review: 'PR_UPDATE',   // ← agregado (cierre de B1/G1)
  approved:     'PR_APPROVE',
  rejected:     'PR_REJECT',
  // 'converted' ausente intencionalmente: gateado por PR_CONVERT_TO_PO
  // en purchaseRequestConversionService antes de llamar a esta función.
};
```

### Flujo resultante

```
transitionPurchaseRequestStatus(pr, 'submitted', 'under_review', userId)
  │
  ├─ getActor()                        → lanza ACTOR_REQUIRED si no hay actor
  ├─ STATUS_ACTION_MAP['under_review'] → 'PR_UPDATE'
  ├─ assertCan(actor, 'PR_UPDATE')     → lanza POLICY_DENY:PR_UPDATE si rol sin permiso
  └─ canTransition('submitted', 'under_review') → true → continúa
```

Roles con `PR_UPDATE = true` (definidos en `src/config/policyPresets.ts`): `admin`, `procurement`, `warehouse_manager`.

---

## B2 — Tests de enforcement de política

### Archivo de tests

`src/ledger/__tests__/purchaseRequestService.test.ts`

### Casos cubiertos (4 tests)

| # | Caso | Expectativa |
|---|------|-------------|
| 1 | Actor `viewer` (sin `PR_UPDATE`) → `under_review` | Lanza `POLICY_DENY:PR_UPDATE` |
| 2 | Actor `admin` (con `PR_UPDATE`) → `under_review` | OK: `result.status === 'under_review'`, `result.version > pr.version` |
| 3 | Actor `procurement` (con `PR_UPDATE`) → `under_review` | OK: `result.status === 'under_review'` |
| 4 | Actor `viewer` → `submitted` (guard de regresión) | Lanza `POLICY_DENY:PR_SUBMIT` |

### Patrón de aislamiento

```typescript
// Mock de idbStorage antes de importar cualquier store.
// Node no tiene IndexedDB; sin este mock se producen rejections sin capturar.
vi.mock('../../infra/idbStorage', () => ({
  idbStorage: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
}));
```

---

## B3 — UI no escribe a localStorage/sessionStorage

### Qué se eliminó (`81e7b75`, `src/App.tsx`)

Tres bloques `useEffect` que escribían después de cada cambio de estado:

```diff
-  useEffect(() => {
-    localStorage.setItem('ef-whs', JSON.stringify(whs));
-  }, [whs]);
-
-  useEffect(() => {
-    localStorage.setItem('ef-reqs', JSON.stringify(reqs));
-  }, [reqs]);
-
-  useEffect(() => {
-    localStorage.setItem('ef-inv', JSON.stringify(inv));
-  }, [inv]);
-
-  useEffect(() => {
-    localStorage.setItem('ef-hist', JSON.stringify(hist));
-  }, [hist]);
+
+  // legacy bootstrap read-only; DO NOT write to localStorage (B3)
+  // whs/inv/hist are seeded from localStorage once on mount (getItem above).
+  // Ongoing persistence is handled by Zustand stores via IndexedDB (idbStorage).
```

### Verificación: 0 escrituras en `src/`

```sh
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" src
# → sin output (exit 1, 0 coincidencias)
```

### Lecturas restantes — bootstrap legacy (read-only)

| Archivo | Línea | Clave | Clasificación |
|---------|-------|-------|--------------|
| `src/App.tsx` | 30 | `ef-whs` | Bootstrap one-time al montar (read-only) |
| `src/App.tsx` | 62 | `ef-inv` | Bootstrap one-time al montar (read-only) |
| `src/App.tsx` | 72 | `ef-hist` | Bootstrap one-time al montar (read-only) |
| `src/ledger/transferStore.ts` | 21 | `ef-transfers` | Bootstrap de migración (read-only, si IDB vacío) |
| `src/ledger/ledgerStore.ts` | 31 | `ef-ledger` | Bootstrap de migración (read-only, si IDB vacío) |
| `src/ledger/purchaseOrderStore.ts` | 28 | `ef-pos` | Bootstrap de migración (read-only, si IDB vacío) |
| `src/ledger/purchaseRequestStore.ts` | 21 | `ef-reqs` | Bootstrap de migración (read-only, si IDB vacío) |

Todas son `getItem` de un solo uso en inicialización. Ninguna escribe de vuelta.

### Arquitectura de persistencia vigente

```
UI (React)
  │ lectura de estado vía hooks
  ▼
Zustand store ──persist middleware──► idbStorage (localforage) ──► IndexedDB
  ▲
  │ escritura vía service layer (assertCan → store.update → auditStore.addLog)

localStorage ──getItem (único, al montar)──► seed inicial del useState
              (sin setItem en ningún camino activo)
```

**Stores de dominio y claves IDB:**

| Store | Clave IDB |
|-------|-----------|
| `useAuditStore` | `ef-audit` |
| `usePurchaseRequestStore` | `ef-reqs` |
| `usePurchaseOrderStore` | `ef-pos` |
| `useLedgerStore` | `ef-ledger` |
| `useTransferStore` | `ef-transfers` |

---

## Puertas de calidad — rama `chore/audit-fase4-master-alignment`

| Puerta | Comando | Resultado |
|--------|---------|-----------|
| Verificación de tipos | `npm run typecheck` | ✅ 0 errores |
| Suite de pruebas | `npx vitest run` | ✅ 20/20 — 3 archivos |
| Build de producción | `npm run build` | ✅ sin errores |

**Detalle de tests:**

```
✓ src/ledger/__tests__/purchaseRequestService.test.ts  (4 tests)
✓ src/import/parser/__tests__/importParser.test.ts     (8 tests)
✓ src/utils/__tests__/warehouseNormalizer.test.ts      (8 tests)

Test Files: 3 passed (3)
Tests:      20 passed (20)
```

---

## Historial de commits relevantes

| Commit | Mensaje | Blocker |
|--------|---------|---------|
| `311f8dc` | `fix(security): enforce assertCan for under_review transition (close G1)` | B1 + B2 |
| `81e7b75` | `fix(persist): remove UI localStorage writes (legacy read-only)` | B3 |
| `a74f771` | `docs(audit): close B3 evidence (no UI local/session storage writes)` | Evidencia B3 |

---

## Cómo reproducir (comandos exactos)

```sh
# Clonar y posicionarse en la rama
git checkout chore/audit-fase4-master-alignment

# B1/B2 — Verificar STATUS_ACTION_MAP
grep -n "under_review" src/ledger/purchaseRequestService.ts
# → debe aparecer: under_review: 'PR_UPDATE',

# B2 — Correr tests de policy enforcement
npx vitest run src/ledger/__tests__/purchaseRequestService.test.ts

# B3 — Confirmar 0 escrituras
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" src
# → sin output (exit 1)

# Puertas completas
npm run typecheck
npx vitest run
npm run build
```

---

*Los logs `.audit/pr5_*.txt` son locales y no se versionan (`.gitignore`). Para obtenerlos, ejecutar los comandos de la sección anterior.*
