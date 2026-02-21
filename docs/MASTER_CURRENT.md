# MASTER_CURRENT -- Resumen de Estado Vigente

> ATENCION: Este archivo es un RESUMEN/SNAPSHOT derivado.
> El documento canonico y fuente de verdad es: `docs/MASTER_DOCUMENT.md`
> En caso de conflicto entre este resumen y el master canonico, prevalece `docs/MASTER_DOCUMENT.md`.

---

## Estado Actual: FASE 2 COMPLETADA -- FASE 3 COMPLETADA

Las fases 1, 2 y 3 estan completadas y certificadas.
Ver criterios completos y detalle de cada fase en `docs/MASTER_DOCUMENT.md`.

## Garantias Vigentes

- Actor obligatorio en toda operacion mutante (`getActor()` lanza `ACTOR_REQUIRED`)
- Policy enforcement centralizado (`assertCan()` lanza `POLICY_DENY:<action>`)
- Sin mutacion directa de stores fuera de services
- Sin dependencias circulares
- `tsc --noEmit` limpio
- `npm run build` limpio
- Todos los stores persisten en IndexedDB via `idbStorage`
- Audit log registrado en `auditStore` para toda operacion mutante

## Referencia

Para el detalle completo de criterios, invariantes, pipeline Actor->Policy->Service->Store->Audit,
y reglas no negociables, consultar: **`docs/MASTER_DOCUMENT.md`**
