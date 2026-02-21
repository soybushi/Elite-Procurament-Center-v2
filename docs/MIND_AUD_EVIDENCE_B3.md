# Evidencia de Cierre — B3: UI no escribe a localStorage

**Rama:** `chore/audit-fase4-master-alignment`
**Commit de corrección:** `81e7b75`
**Fecha de recolección:** 2026-02-21
**Responsable técnico:** equipo de desarrollo (evidencia generada automáticamente)
**Blocker de referencia:** B3 — "Stores de dominio persisten en IDB; la UI no debe escribir directamente a localStorage"

---

## 1. Resumen ejecutivo

La búsqueda automatizada sobre `src/` confirma **0 (cero) llamadas** a
`localStorage.setItem`, `localStorage.removeItem`, `localStorage.clear`,
`sessionStorage.setItem`, `sessionStorage.removeItem` o `sessionStorage.clear`
en el código fuente de la interfaz de usuario.

Las tres escrituras que existían (`ef-whs`, `ef-inv`, `ef-hist`) fueron
eliminadas en el commit `81e7b75`. Los estados que manejaban esas claves
ahora viven en stores de Zustand que persisten exclusivamente a IndexedDB
mediante `idbStorage` (localforage).

---

## 2. Evidencia de búsqueda — escrituras a localStorage/sessionStorage

Los siguientes comandos se ejecutaron sobre el directorio `src/` y produjeron
**cero coincidencias** (código de salida 1, sin líneas de resultado):

```
rg -n "localStorage\.(setItem|removeItem|clear)\("    src/
rg -n "sessionStorage\.(setItem|removeItem|clear)\("  src/
rg -n "window\.(localStorage|sessionStorage)\.(setItem|removeItem|clear)\(" src/
```

Salida: vacía (ningún match). Archivos de evidencia: `.audit/localStorage_writes.txt`,
`.audit/sessionStorage_writes.txt`, `.audit/window_storage_writes.txt` (tamaño 0 bytes cada uno).

---

## 3. Lecturas restantes — bootstrap de solo lectura (legítimas)

Las únicas referencias a `localStorage.getItem` que quedan en `src/` son
lecturas de un solo uso en el montado inicial del componente raíz
(`src/App.tsx`) y en stores de versiones legadas. Son bootstrap de solo lectura
y **no constituyen escritura**.

```
src/ledger/transferStore.ts:21      window.localStorage.getItem('ef-transfers')
src/ledger/ledgerStore.ts:31        window.localStorage.getItem('ef-ledger')
src/ledger/purchaseOrderStore.ts:28 window.localStorage.getItem('ef-pos')
src/ledger/purchaseRequestStore.ts:21 window.localStorage.getItem('ef-reqs')
src/App.tsx:30                      localStorage.getItem('ef-whs')
src/App.tsx:62                      localStorage.getItem('ef-inv')
src/App.tsx:72                      localStorage.getItem('ef-hist')
```

Comentario en código (`src/App.tsx`):

```typescript
// legacy bootstrap read-only; DO NOT write to localStorage (B3)
// whs/inv/hist are seeded from localStorage once on mount (getItem above).
// Ongoing persistence is handled by Zustand stores via IndexedDB (idbStorage).
```

---

## 4. Diff del commit de corrección (src/App.tsx)

Commit `81e7b75` — eliminó exactamente 12 líneas de efectos de escritura y
los reemplazó con referencias a los stores de Zustand correspondientes:

```diff
-  // Persistence Effects
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

+  // Transfers — owned by Zustand store (persisted under "ef-transfers")
+  const tr = useTransferStore((s) => s.transfers);
+
+  // Purchase Requests — owned by Zustand store (persisted under "ef-reqs")
+  const reqs = usePurchaseRequestStore((s) => s.purchaseRequests);
+
+  // legacy bootstrap read-only; DO NOT write to localStorage (B3)
+  // whs/inv/hist are seeded from localStorage once on mount (getItem above).
+  // Ongoing persistence is handled by Zustand stores via IndexedDB (idbStorage).
```

Mensaje de commit completo:

```
fix(persist): remove UI localStorage writes (legacy read-only)

Remove three useEffect blocks that were writing ef-whs, ef-inv, ef-hist
to localStorage after every state change. These writes violated B3:
all ongoing persistence must go through IndexedDB (Zustand + idbStorage).

The three localStorage.getItem() calls in useState initializers are kept
as legacy bootstrap reads (one-time seed on mount) with explicit comment:
  // legacy bootstrap read-only; DO NOT write to localStorage (B3)

Domain stores (ef-reqs, ef-pos, ef-ledger, ef-transfers, ef-audit) were
already persisting exclusively to IndexedDB via localforage/idbStorage.

rg confirms 0 localStorage.setItem/removeItem/clear remaining in src/.
```

---

## 5. Puertas de calidad — resultados post-corrección

Todos los controles se ejecutaron en el mismo commit (`81e7b75`) y resultaron
en código de salida 0:

| Puerta | Comando | Resultado |
|--------|---------|-----------|
| Verificación de tipos | `npm run typecheck` | ✅ 0 errores |
| Suite de pruebas | `npx vitest run` | ✅ 20/20 pruebas, 3 archivos |
| Build de producción | `npm run build` | ✅ compilado sin errores |

Detalle de pruebas:

```
✓ src/ledger/__tests__/purchaseRequestService.test.ts (4 pruebas)
✓ src/import/parser/__tests__/importParser.test.ts   (8 pruebas)
✓ src/utils/__tests__/warehouseNormalizer.test.ts    (8 pruebas)

Test Files: 3 passed (3)
Tests:      20 passed (20)
```

---

## 6. Arquitectura de persistencia vigente

Después de esta corrección, el flujo de persistencia queda:

```
UI (React) ──hooks──► Zustand store ──persist──► idbStorage (localforage) ──► IndexedDB
                                                          ▲
                                          única ruta de escritura persistente

localStorage ──getItem──► useState (bootstrap one-time, solo lectura)
```

Stores de dominio y sus claves IDB:

| Store | Clave IDB |
|-------|-----------|
| `useAuditStore` | `ef-audit` |
| `usePurchaseRequestStore` | `ef-reqs` |
| `usePurchaseOrderStore` | `ef-pos` |
| `useLedgerStore` | `ef-ledger` |
| `useTransferStore` | `ef-transfers` |

---

## 7. Comandos para reproducir la evidencia

```bash
# 1. Confirmar 0 escrituras
rg -n "localStorage\.(setItem|removeItem|clear)\("    src/
rg -n "sessionStorage\.(setItem|removeItem|clear)\("  src/

# 2. Puertas de calidad
npm run typecheck
npx vitest run
npm run build

# 3. Ver commit de corrección
git show 81e7b75 --stat
git diff main...HEAD -- src/App.tsx
```

---

*Documento generado automáticamente a partir de la ejecución de los comandos
anteriores en la rama `chore/audit-fase4-master-alignment`, commit `81e7b75`.*
