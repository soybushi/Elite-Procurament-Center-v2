# Gobernanza de Fases, Versionado y Contratos Operativos

> Documento normativo del proyecto **Elite Procurement Center v2**.
> Toda contribución (humana o asistida por IA) debe cumplir estas reglas sin excepción.

---

## 1. Control de Fases

### 1.1 Clasificación obligatoria de ideas

Toda idea, solicitud de cambio o mejora **debe clasificarse** antes de cualquier acción:

| Categoría | Descripción |
|---|---|
| **Fase actual** | Pertenece al bloque arquitectónico en curso. |
| **Estructural** | Afecta cimientos del proyecto (stores, tipos base, ledger). |
| **Funcional** | Mejora o extiende funcionalidad existente sin alterar estructura. |
| **Futura** | No corresponde a ninguna fase activa; se agenda para después. |

### 1.2 Decisión obligatoria

Tras clasificar, se debe tomar **una** de las siguientes decisiones con una **línea de justificación**:

| Decisión | Cuándo aplica |
|---|---|
| **Implementar ahora** | La idea pertenece a la fase actual y no introduce riesgo lateral. |
| **Agendar** | La idea es válida pero corresponde a otra fase o requiere preparación previa. |
| **Descartar** | La idea no aporta valor, duplica funcionalidad o viola la arquitectura vigente. |

**Formato obligatorio:**

```
Idea: [descripción breve]
Clasificación: [fase actual / estructural / funcional / futura]
Decisión: [implementar ahora / agendar / descartar]
Justificación: [una línea explicando el porqué]
```

---

## 2. Versionado

### 2.1 Commit al cerrar bloque arquitectónico

Al completar un bloque arquitectónico (store, servicio, componente clave, integración), se **debe sugerir un commit** inmediatamente.

### 2.2 Prohibición de acumulación

Queda **prohibido** acumular múltiples cambios arquitectónicos sin versionar. Cada bloque cerrado = un commit.

### 2.3 Snapshot limpio antes de nueva fase

Antes de iniciar cualquier fase nueva, se **exige**:

1. Que todos los cambios de la fase anterior estén commiteados.
2. Que el build pase sin errores.
3. Que no existan archivos sin rastrear relacionados con la fase anterior.

### 2.4 Pregunta obligatoria

En toda transición entre bloques o fases, se debe incluir la pregunta:

> **¿Hacemos commit antes de continuar?**

Esta pregunta no es opcional. Debe formularse explícitamente antes de proceder.

---

## 3. Contrato de asistente IA

Toda instrucción dirigida al asistente IA debe cumplir el siguiente formato:

### 3.1 Reglas de instrucción

- **Un solo bloque de texto.** No fragmentar en múltiples mensajes.
- **Directa.** Sin introducciones, sin contexto teórico, sin explicaciones largas.
- **Accionable.** Debe ser ejecutable tal como está escrita.
- **Sin teoría.** Nada de "en general se recomienda…" o "una buena práctica sería…".
- **Sin opciones.** Una sola ruta de acción clara. No presentar alternativas.
- **Sin rediseños globales.** Nunca pedir reestructuraciones del proyecto completo.
- **Archivos a tocar.** Listar explícitamente qué archivos se deben modificar o crear.
- **Archivos a NO tocar.** Listar explícitamente qué archivos están fuera de alcance.
- **Validación.** Definir cómo verificar que el cambio es correcto.

### 3.2 Plantilla de instrucción

```
INSTRUCCIÓN:
[Descripción directa de la acción a realizar]

ARCHIVOS A TOCAR:
- [ruta/archivo1.ts]
- [ruta/archivo2.ts]

NO TOCAR:
- [ruta/archivoProtegido.ts]

VALIDACIÓN:
- [Cómo verificar que el cambio funciona]
```

---

## 4. Regla AI/LUNO (Arquitectura Inviolable / Flujo Integrado de Transacciones Oficiales)

Estas restricciones aplican a **toda** modificación, ya sea humana o generada por IA:

### 4.1 Nunca modificar stores directamente

Los stores (`ledgerStore`, `purchaseOrderStore`, `purchaseRequestStore`, `auditStore`, `aiStore`) son la fuente de verdad. **Nunca** se deben mutar directamente desde componentes, utilidades o scripts. Toda mutación pasa por servicios oficiales.

### 4.2 Nunca saltar servicios oficiales

Todo flujo de datos debe pasar por los servicios designados (e.g., `purchaseRequestService`, `purchaseRequestCreationService`, `purchaseRequestConversionService`, `applyImportBatch`). **No** se permite crear atajos, wrappers paralelos ni mutaciones directas que eviten estos servicios.

### 4.3 Nunca evitar auditoría

Toda operación que modifique estado **debe** generar registro de auditoría a través de `auditStore`. No se permiten operaciones silenciosas ni "modo rápido" sin trazabilidad.

### 4.4 Nunca evitar roles

El sistema de roles y permisos debe respetarse en toda operación. No se permiten bypasses de autorización, ni hardcodeos de permisos, ni eliminación de validaciones de rol.

---

## 5. Estructura Obligatoria de Respuesta

Toda respuesta a una solicitud de cambio, análisis o diagnóstico debe seguir esta estructura **sin excepción**:

### 5.1 Formato de respuesta

```
## Diagnóstico
[Qué está ocurriendo y por qué]

## Riesgos
[Qué puede salir mal si se actúa o si no se actúa]

## Fase
[A qué fase pertenece este cambio: fase actual / estructural / funcional / futura]

## Instrucción de asistente IA (si aplica)
[Instrucción directa siguiendo el Contrato de asistente IA de la sección 3]

## Qué no tocar
[Lista explícita de archivos y áreas protegidas]

## Validación
[Pasos concretos para verificar que el cambio es correcto]

## Resumen para registro
[Una línea que resuma la acción tomada, para bitácora del proyecto]
```

### 5.2 Reglas adicionales

- Todos los campos son obligatorios. Si no aplica "Instrucción de asistente IA", escribir "No aplica — solo diagnóstico".
- El campo "Resumen para registro" debe ser una sola línea, apta para copiar a un changelog o bitácora.
- No se permite omitir "Riesgos" ni "Qué no tocar", incluso si parecen obvios.

---

## Vigencia

Este documento entra en vigor a partir de su creación y aplica a todas las fases subsiguientes del proyecto. Cualquier modificación a estas reglas debe ser versionada y justificada siguiendo el mismo proceso descrito en la Sección 1.

### Reglas clave — Resumen ejecutivo

- **Prohibición de saltar fases.** Ningún cambio puede implementarse fuera de la fase que le corresponde; debe clasificarse y decidirse antes de actuar.
- **Obligación de clasificación de ideas nuevas.** Toda idea debe pasar por el flujo Clasificación → Decisión → Justificación antes de cualquier línea de código.
- **Commit obligatorio al cerrar bloque.** Al completar un bloque arquitectónico se debe versionar inmediatamente; queda prohibido acumular cambios sin commit.
- **Snapshot limpio antes de nueva fase.** No se inicia fase nueva sin que la anterior esté 100 % commiteada, con build limpio y sin archivos sin rastrear.
- **Prohibición de modificar stores directamente (AI/LUNO).** Los stores son fuente de verdad inviolable; toda mutación pasa por servicios oficiales, con auditoría y respeto de roles.
- **Obligación de validación con `npm run build`.** Todo cambio debe pasar el build antes de considerarse completo; nunca se versiona código que no compile.
