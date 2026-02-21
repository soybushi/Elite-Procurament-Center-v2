# DECISIONS LOG -- Elite Procurement Center v2

Registro de decisiones arquitectonicas y de gobernanza.
Toda modificacion al documento master debe registrarse aqui.

---

## 2026-02-21 -- Canonicidad del Master Document

**Entrada:** Establecimiento del documento canonico del proyecto.

**Decision:**
- `docs/MASTER_DOCUMENT.md` es el UNICO master canonico del proyecto.
- `docs/MASTER_CURRENT.md` es un resumen/snapshot derivado sin precedencia sobre el canonico.
- En caso de conflicto entre ambos documentos, `docs/MASTER_DOCUMENT.md` prevalece siempre.

**Razon:** Requerimiento de certificacion por Mind AUD. El audit packet PR #6
(rama `docs/audit-packet-f1f3`) requiere que el documento master sea completo,
canonico, y cubriendo FASE 1, 2 y 3 -- no solo FASE 2 como estaba en el resumen previo.

**Alcance del master canonico:**
- FASE 1: Core Engine Foundation (stores, services, state machine, ledger inmutable, PR->PO idempotente)
- FASE 2: Security & Tenancy (Actor model, policy engine, enforcement, tenancy)
- FASE 3: PR Domain Convergence (purchaseRequestStore, updatePurchaseRequest enforced, UI no bypass)
- Pipeline central: Actor -> Policy -> Service -> Store -> Audit
- Reglas no negociables (AI/LUNO)
- Governance de fases

**Registrado por:** Proceso de certificacion docs-only PR #6
**Commit de referencia:** en rama `docs/audit-packet-f1f3`

---

## 2026-02-21 -- Limpieza de Vendor References en Docs de Auditoria

**Decision:**
- Los archivos `docs/AUDIT_FASE_1_3_REPORT.md` y `docs/AUDIT_PACKET_SUMMARY.md`
  no deben referenciar herramientas o proveedores especificos.
- Referencia reemplazada por: "Generado por herramienta automatizada configurable (solo lectura)."

**Razon:** Neutralidad requerida por Mind AUD para certificacion.

---

## 2026-02-21 -- Higiene Unicode en Documentos

**Decision:**
- Todos los archivos en `docs/` deben estar limpios de caracteres Unicode bidi
  y de control invisibles (U+202A-U+202E, U+2066-U+2069, U+200E, U+200F, U+061C).
- Codificacion: UTF-8 con saltos de linea LF.

**Razon:** Requerimiento de higiene para audit packet libre de warnings de GitHub.
