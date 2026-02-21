# Audit Submission Pack — PR #5

> Documento preparado para revisión offline por Mind AUD.
> Contiene alcance auditado, evidencia reproducible, recomendación GO/NO-GO
> y guía de revisión.

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Fecha/hora** | 2026-02-21 16:22 UTC |
| **PR** | #5 — "Phase 4 master alignment: integrate core + close G1 blocker" |
| **URL PR** | https://github.com/soybushi/Elite-Procurament-Center-v2/pull/5 |
| **Rama** | `chore/audit-fase4-master-alignment` |
| **Base** | `main` |
| **Commit HEAD** | `447609c` |
| **Estado PR** | OPEN · Ready for review (no Draft) |
| **Master doc** | `docs/MASTER_DOCUMENT.md` |
| **Evidencia detallada** | `docs/MIND_AUD_EVIDENCE_PR5.md`, `docs/MIND_AUD_EVIDENCE_B3.md` |

---

## 2. Alcance auditado (checklist)

### 2.1 Pipeline Actor → Policy → Service → Store → Audit

- [x] **`getActor()`** lanza `ACTOR_REQUIRED` si no hay actor en `authStore`
      (`src/stores/authStore.ts`)
- [x] **`assertCan(actor, action)`** lanza `POLICY_DENY:<action>` si el rol no
      tiene permiso; default DENY para cualquier rol/acción no declarada
      (`src/core/security/policyEngine.ts`)
- [x] **`POLICY_PRESETS`** mapea `role → Action[]`; roles: `admin`, `procurement`,
      `warehouse_manager`, `viewer`, `finance`
      (`src/config/policyPresets.ts`)
- [x] **Ningún componente UI** llama directamente a métodos de store que muten
      estado sin pasar por el service layer con `assertCan`
- [x] **`auditStore.addLog`** registrado en cada mutación de dominio relevante;
      store persiste a IDB bajo clave `ef-audit`
      (`src/ledger/auditStore.ts`)

### 2.2 Persistencia en IndexedDB (Zustand persist + idbStorage/localforage)

- [x] Todos los stores de dominio usan middleware `persist` con `createJSONStorage(() => idbStorage)`
- [x] `idbStorage` es un wrapper de localforage sobre IndexedDB (`src/infra/idbStorage.ts`)
- [x] **0 writes** a `localStorage`/`sessionStorage` desde código activo en `src/`

| Store | Clave IDB |
|-------|-----------|
| `useAuditStore` | `ef-audit` |
| `usePurchaseRequestStore` | `ef-reqs` |
| `usePurchaseOrderStore` | `ef-pos` |
| `useLedgerStore` | `ef-ledger` |
| `useTransferStore` | `ef-transfers` |

### 2.3 Bootstrap legacy read-only

- [x] Las 7 referencias restantes a `localStorage.getItem` son lecturas de un único
      uso al inicializar el componente raíz o stores legacy; **ninguna escribe de vuelta**

| Archivo | Línea | Clave | Clasificación |
|---------|-------|-------|--------------|
| `src/App.tsx` | 30 | `ef-whs` | Bootstrap one-time (read-only) |
| `src/App.tsx` | 62 | `ef-inv` | Bootstrap one-time (read-only) |
| `src/App.tsx` | 72 | `ef-hist` | Bootstrap one-time (read-only) |
| `src/ledger/transferStore.ts` | 21 | `ef-transfers` | Migración legacy (read-only si IDB vacío) |
| `src/ledger/ledgerStore.ts` | 31 | `ef-ledger` | Migración legacy (read-only si IDB vacío) |
| `src/ledger/purchaseOrderStore.ts` | 28 | `ef-pos` | Migración legacy (read-only si IDB vacío) |
| `src/ledger/purchaseRequestStore.ts` | 21 | `ef-reqs` | Migración legacy (read-only si IDB vacío) |

Comentario explícito en código (`src/App.tsx:84`):

```typescript
// legacy bootstrap read-only; DO NOT write to localStorage (B3)
```

### 2.4 B1/G1 cerrado — `under_review` exige `assertCan(PR_UPDATE)`

- [x] `STATUS_ACTION_MAP` en `src/ledger/purchaseRequestService.ts:90-95` cubre
      **todos** los estados writables:

```typescript
const STATUS_ACTION_MAP: Partial<Record<PurchaseRequestStatus, Action>> = {
  submitted:    'PR_SUBMIT',
  under_review: 'PR_UPDATE',   // cerrado B1/G1 — commit 311f8dc
  approved:     'PR_APPROVE',
  rejected:     'PR_REJECT',
  // 'converted': ausente — gateado por PR_CONVERT_TO_PO en conversionService
};
```

- [x] `transitionPurchaseRequestStatus` llama `assertCan(actor, action)` para
      **cualquier** estado presente en el mapa (líneas 104-107)

### 2.5 Tests de enforcement de política (B2)

- [x] Archivo: `src/ledger/__tests__/purchaseRequestService.test.ts`
- [x] 4 casos cubiertos:

| # | Caso | Expectativa |
|---|------|-------------|
| 1 | `viewer` → `under_review` | Lanza `POLICY_DENY:PR_UPDATE` |
| 2 | `admin` → `under_review` | OK — `status === 'under_review'`, `version` incrementado |
| 3 | `procurement` → `under_review` | OK — `status === 'under_review'` |
| 4 | `viewer` → `submitted` | Lanza `POLICY_DENY:PR_SUBMIT` (guard de regresión) |

### 2.6 Gaps G2–G4 — propuestos como backlog no-bloqueante

| Gap | Descripción | Severidad propuesta |
|-----|-------------|---------------------|
| G2 | Cobertura de test aislada para internals de `ledgerStore` | Baja |
| G3 | Cobertura de tests en `applyImportBatch` | Media |
| G4 | Tests de audit entity `data_import` en `applyImportBatch` | Media |

Se solicita confirmación de Mind AUD de que G2/G3/G4 son no-bloqueantes.

---

## 3. Evidencia reproducible

### 3.1 Comandos exactos

```bash
# Posicionarse en la rama
git checkout chore/audit-fase4-master-alignment

# Gate 1 — verificación de tipos
npm run typecheck > .audit/typecheck.txt 2>&1
# Resultado esperado: exit 0, 0 errores

# Gate 2 — suite de pruebas
npx vitest run > .audit/test.txt 2>&1
# Resultado esperado: exit 0, 20/20 tests

# Gate 3 — build de producción
npm run build > .audit/build.txt 2>&1
# Resultado esperado: exit 0, "✓ built in Xs"

# Evidencia B3 — 0 writes a localStorage/sessionStorage
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" \
   src > .audit/storage_writes_rg.txt || true
# Resultado esperado: archivo vacío (exit 1, 0 matches)

# Evidencia B3 — reads bootstrap (clasificadas)
rg -n "localStorage\.getItem\b|sessionStorage\.getItem\b|window\.localStorage\.getItem\b" \
   src > .audit/storage_reads_rg.txt || true
# Resultado esperado: 7 líneas, todas getItem

# Log de commits
git --no-pager log --oneline -n 50 > .audit/git_log_50.txt

# Diff vs main
git --no-pager diff --stat origin/main...HEAD > .audit/diff_stat_vs_main.txt
```

### 3.2 Resultados obtenidos (2026-02-21 16:22 UTC, commit `447609c`)

| Gate / Check | Comando | Exit | Resultado |
|---|---|---|---|
| Typecheck | `npm run typecheck` | `0` | ✅ 0 errores |
| Tests | `npx vitest run` | `0` | ✅ 20/20 — 3 archivos |
| Build | `npm run build` | `0` | ✅ `built in 6.01s` |
| localStorage writes | `rg …setItem\|removeItem\|clear… src` | `1` | ✅ 0 coincidencias |
| localStorage reads | `rg …getItem… src` | `0` | ✅ 7 líneas — todas `getItem` (read-only) |

**Detalle de tests:**

```
✓ src/ledger/__tests__/purchaseRequestService.test.ts  (4 tests)  5ms
✓ src/import/parser/__tests__/importParser.test.ts     (8 tests)  7ms
✓ src/utils/__tests__/warehouseNormalizer.test.ts      (8 tests)  4ms

Test Files: 3 passed (3)
Tests:      20 passed (20)
Duration:   836ms
```

### 3.3 Archivos de evidencia locales (en `.audit/`, no versionados)

| Archivo | Contenido |
|---------|-----------|
| `.audit/typecheck.txt` | Salida completa de `npm run typecheck` |
| `.audit/test.txt` | Salida completa de `npx vitest run` |
| `.audit/build.txt` | Salida completa de `npm run build` |
| `.audit/storage_writes_rg.txt` | Resultado grep de writes (tamaño 0) |
| `.audit/storage_reads_rg.txt` | Resultado grep de reads (7 líneas) |
| `.audit/git_log_50.txt` | Últimos 50 commits (oneline) |
| `.audit/diff_stat_vs_main.txt` | `diff --stat origin/main...HEAD` |

Estos archivos se incluyen en `mind_aud_pr5_evidence.zip` (entregable offline, §6).

---

## 4. GO/NO-GO recomendado

**RECOMENDACIÓN: GO para merge a `main`**

Justificación:
- Los tres blockers originales (B1, B2, B3) están cerrados con commits trazables.
- Todos los gates pasan (typecheck, tests 20/20, build) en el commit HEAD `447609c`.
- La búsqueda automatizada confirma 0 writes a `localStorage`/`sessionStorage`.
- El pipeline `Actor → Policy → Service → Store → Audit` está implementado y verificado.
- Los 7 `getItem` restantes están clasificados y comentados como bootstrap read-only.
- Los gaps G2/G3/G4 son de cobertura de tests adicionales y no representan un riesgo de seguridad activo.

---

## 5. Qué debe revisar Mind AUD

Puntos críticos y dónde mirar:

| Punto | Qué verificar | Ruta |
|-------|--------------|------|
| **Pipeline completo** | ¿Existe algún componente UI que mute estado sin pasar por service + assertCan? | `src/components/*.tsx` → buscar llamadas directas a store.set* |
| **B1 enforcement** | `STATUS_ACTION_MAP` contiene todos los estados writables; `assertCan` se llama antes de mutación | `src/ledger/purchaseRequestService.ts:90-115` |
| **B2 tests** | 4 tests cubren DENY/PASS para `under_review` y regresión `submitted` | `src/ledger/__tests__/purchaseRequestService.test.ts` |
| **B3 writes** | Reproducir: `rg "localStorage\.(setItem\|removeItem\|clear)" src` → debe dar 0 matches | cualquier entorno con el código |
| **IDB keys** | 5 stores tienen `persist` con `idbStorage`; claves `ef-*` | `src/ledger/*Store.ts` (buscar `name: 'ef-`) |
| **Bootstrap reads** | 7 `getItem` sin `setItem` de vuelta; comentario explícito en App.tsx | `src/App.tsx:30,62,72` + stores legacy línea 21/31/28 |
| **auditStore** | Persiste a IDB (`ef-audit`); `addLog` llamado en service layer | `src/ledger/auditStore.ts` |
| **G2/G3/G4** | Cobertura adicional pendiente; sin riesgo de seguridad activo | `src/ledger/applyImportBatch.ts`, `src/ledger/ledgerStore.ts` |

---

## 6. Entregables para enviar offline

| Entregable | Tipo | Descripción |
|-----------|------|-------------|
| **(a) `docs/MIND_AUD_SUBMISSION_PR5.md`** | Versionado en repo | Este documento — alcance, evidencia, recomendación |
| **(b) `mind_aud_pr5_evidence.zip`** | Local, **NO versionado** | `.audit/*.txt` + este `.md`; reproducible con comandos §3.1 |

Documentos de apoyo versionados:
- `docs/MIND_AUD_EVIDENCE_PR5.md` — evidencia detallada B1/B2/B3
- `docs/MIND_AUD_EVIDENCE_B3.md` — evidencia específica B3
- `docs/MIND_AUD_REQUEST_PR5.md` — solicitud formal previa

---

## 7. Respuesta requerida de Mind AUD

1. **GO** — si todos los criterios del scope (§2) se cumplen → autorizar merge a `main`.
2. **NO-GO** — si se identifican nuevos blockers:
   - ID de blocker (Bx o Gx)
   - Archivo y línea exacta
   - Fix mínimo requerido
3. **Confirmar** que G2, G3 y G4 quedan como backlog no-bloqueante
   (o reclasificar con justificación si aplica).

---

*Para reproducir toda la evidencia: clonar la rama `chore/audit-fase4-master-alignment`
(commit `447609c`) y ejecutar los comandos de §3.1.*
