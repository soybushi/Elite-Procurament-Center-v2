# Evidencia de Cierre — B3: UI no escribe a localStorage/sessionStorage

| Campo | Valor |
|-------|-------|
| **Blocker** | B3 — "Stores de dominio persisten en IDB; la UI no debe escribir directamente a localStorage/sessionStorage" |
| **Rama** | `chore/audit-fase4-master-alignment` |
| **Commit de corrección** | `81e7b75` — `fix(persist): remove UI localStorage writes (legacy read-only)` |
| **Fecha de recolección** | 2026-02-21 |
| **Logs locales** | `.audit/b3_grep_writes.txt`, `.audit/b3_grep_window.txt`, `.audit/b3_grep_reads.txt`, `.audit/b3_typecheck.txt`, `.audit/b3_test.txt`, `.audit/b3_build.txt` |
| **Nota** | `.audit/` está en `.gitignore` y no se versiona |

---

## 1. Regla B3 — Qué se prohíbe y qué se permite

| | Regla |
|-|-------|
| **Prohibido** | Cualquier escritura a `localStorage` o `sessionStorage` desde código UI (`setItem`, `removeItem`, `clear`) |
| **Permitido** | Lecturas de un solo uso en la inicialización del componente raíz (`getItem`, exclusivamente bootstrap legacy) |
| **Obligatorio** | Toda persistencia activa debe ir a través de los stores de Zustand con middleware `persist` → `idbStorage` (IndexedDB/localforage) |

---

## 2. Resultado de búsqueda — escrituras (CERO COINCIDENCIAS)

Comandos ejecutados sobre `src/`:

```sh
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" src
rg -n "window\.(localStorage|sessionStorage)\.(setItem|removeItem|clear)\b" src
```

**Resultado: 0 coincidencias.** Salida vacía. Código de salida 1 (sin matches).

Archivo de evidencia: `.audit/b3_grep_writes.txt` (tamaño 0 bytes).

---

## 3. Lecturas restantes — clasificación

Comando ejecutado:

```sh
rg -n "localStorage\.getItem\b|sessionStorage\.getItem\b|window\.localStorage\.getItem\b" src
```

Resultado (7 líneas — todas son `getItem`, ninguna es escritura):

| Archivo | Línea | Clave | Contexto |
|---------|-------|-------|---------|
| `src/App.tsx` | 30 | `ef-whs` | Bootstrap legacy — lee warehouses al montar el componente raíz (read-only) |
| `src/App.tsx` | 62 | `ef-inv` | Bootstrap legacy — lee inventario al montar el componente raíz (read-only) |
| `src/App.tsx` | 72 | `ef-hist` | Bootstrap legacy — lee historial al montar el componente raíz (read-only) |
| `src/ledger/transferStore.ts` | 21 | `ef-transfers` | Bootstrap de migración — lee datos heredados si IDB está vacío (read-only) |
| `src/ledger/ledgerStore.ts` | 31 | `ef-ledger` | Bootstrap de migración — lee datos heredados si IDB está vacío (read-only) |
| `src/ledger/purchaseOrderStore.ts` | 28 | `ef-pos` | Bootstrap de migración — lee datos heredados si IDB está vacío (read-only) |
| `src/ledger/purchaseRequestStore.ts` | 21 | `ef-reqs` | Bootstrap de migración — lee datos heredados si IDB está vacío (read-only) |

**Clasificación:** todos son `getItem` de lectura única en la inicialización. Ninguno escribe de vuelta a `localStorage`. Cumplen la excepción de "bootstrap legacy read-only" de la regla B3.

Comentario explícito en `src/App.tsx` (líneas 84-86):

```typescript
// legacy bootstrap read-only; DO NOT write to localStorage (B3)
// whs/inv/hist are seeded from localStorage once on mount (getItem above).
// Ongoing persistence is handled by Zustand stores via IndexedDB (idbStorage).
```

---

## 4. Arquitectura de persistencia vigente

```
UI (React / hooks)
      │
      ▼ lectura de estado
Zustand store  ──persist middleware──► idbStorage (localforage) ──► IndexedDB
      ▲
      │ escritura de estado
Service layer (assertCan → store.update → auditStore.addLog)

localStorage ──getItem (único, al montar)──► useState seed value
             (solo lectura; no hay setItem en ningún path activo)
```

### Stores de dominio y sus claves IDB

| Store | Clave IDB | Tipo de middleware |
|-------|-----------|-------------------|
| `useAuditStore` | `ef-audit` | Zustand `persist` + `idbStorage` |
| `usePurchaseRequestStore` | `ef-reqs` | Zustand `persist` + `idbStorage` |
| `usePurchaseOrderStore` | `ef-pos` | Zustand `persist` + `idbStorage` |
| `useLedgerStore` | `ef-ledger` | Zustand `persist` + `idbStorage` |
| `useTransferStore` | `ef-transfers` | Zustand `persist` + `idbStorage` |

---

## 5. Cambio que cerró B3 (commit `81e7b75`)

Se eliminaron tres bloques `useEffect` en `src/App.tsx` que escribían después de cada cambio de estado:

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

Los estados `reqs` y `tr` se convirtieron a referencias directas desde sus respectivos stores de Zustand:

```diff
-  const [tr, setTr] = useState<TransferItem[]>([]);
-  const [reqs, setReqs] = useState<PurchaseRequest[]>(() => { ... });
+  const tr = useTransferStore((s) => s.transfers);
+  const reqs = usePurchaseRequestStore((s) => s.purchaseRequests);
```

---

## 6. Puertas de calidad — commit `81e7b75`

| Puerta | Comando | Resultado |
|--------|---------|-----------|
| Verificación de tipos | `npm run typecheck` | ✅ 0 errores |
| Suite de pruebas | `npx vitest run` | ✅ 20/20 pruebas — 3 archivos |
| Build de producción | `npm run build` | ✅ compilado sin errores |

Detalle de pruebas:

```
✓ src/ledger/__tests__/purchaseRequestService.test.ts  (4 pruebas)
✓ src/import/parser/__tests__/importParser.test.ts     (8 pruebas)
✓ src/utils/__tests__/warehouseNormalizer.test.ts      (8 pruebas)

Test Files: 3 passed (3)
Tests:      20 passed (20)
```

Logs completos en `.audit/b3_typecheck.txt`, `.audit/b3_test.txt`, `.audit/b3_build.txt`.

---

## 7. Higiene de artefactos

Las siguientes entradas están presentes en `.gitignore` y no se versionan:

```
.audit/
.snapshots/
audit-packet-*.zip
```

---

## 8. Cómo reproducir (comandos exactos)

```sh
# En rama: chore/audit-fase4-master-alignment

# 1. Confirmar 0 escrituras
rg -n "localStorage\.(setItem|removeItem|clear)\b|sessionStorage\.(setItem|removeItem|clear)\b" src
# → sin output (exit 1)

# 2. Ver lecturas bootstrap (clasificadas como read-only)
rg -n "localStorage\.getItem\b|sessionStorage\.getItem\b|window\.localStorage\.getItem\b" src

# 3. Puertas de calidad
npm run typecheck
npx vitest run
npm run build

# 4. Ver commit de corrección
git show 81e7b75 --stat
```

---

*Los logs `.audit/` son locales y no se versionan (`.gitignore`). Para reproducir, clonar la rama y ejecutar los comandos del paso 8.*
