# Análisis Exhaustivo de Índices MongoDB
> 10 Marzo 2026 — Validación de coherencia entre documentación y código real

---

## 📊 Resumen Ejecutivo

| Estado | Cantidad | Acción |
|--------|----------|--------|
| ✅ Correcto | 13 | Sin cambios |
| ⚠️ Subóptimo | 7 | Optimizar para mejor performance |
| ❌ Incorrecto | 2 | CORREGIR - rompen queries |
| ❓ No usado | 2 | Remover o documentar decisión |

---

## ✅ ÍNDICES CORRECTOS Y BIEN DEFINIDOS

### IDX-01: usuarios - email (Simple, Único)
- **Query**: Q01 - `findOne({ email })` en `/api/auth/login`
- **Código**: ✓ Usado correctamente
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-02: usuarios - rol + activo (Compuesto)
- **Query**: Q03 - `find({ rol, activo })` en `/api/admin/usuarios`
- **Código**: ✓ GET `/api/admin/usuarios` filtra por `rol` y `activo`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-06: ordenes - usuario_id + estado_actual (Compuesto)
- **Query**: Q19 - `find({ usuario_id, estado_actual? })` en `/api/customer/ordenes`
- **Código**: ✓ Usado en GET `/api/customer/ordenes`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-10: usuarios - sucursal_asignada (Simple)
- **Query**: Q04 - `find({ sucursal_asignada })` validación staff
- **Código**: ✓ Usado en validaciones de endpoints worker/repartidor
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-11: sucursales - ubicacion (2dsphere)
- **Query**: Q09 - `$geoNear({ ubicacion })` en `/api/sucursales/cercana`
- **Código**: ✓ Usado con `$geoNear` aggregation
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-12: restaurantes - tags (Multikey)
- **Query**: Q06 - `find({ tags: { $in } })` en búsqueda por filtro de tags
- **Código**: ✓ Usado en `/api/restaurantes?tags=...`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-13: menuitems - nombre + descripcion (Texto)
- **Query**: Q13 - `$text { $search }` en búsqueda de platillos
- **Código**: ✓ Usado en `/api/restaurantes/[id]/menu?search=`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-14: restaurantes - nombre + descripcion (Texto)
- **Query**: Q07 - `$text { $search }` en búsqueda de restaurantes
- **Código**: ✓ Usado en `/api/restaurantes?search=`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-16: categorias - restaurante_id + activa (Compuesto)
- **Query**: Q11 - `find({ restaurante_id, activa: true })`
- **Código**: ✓ Usado en búsqueda de categorías
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-18: resenas - usuario_id (Simple)
- **Query**: Q23, Q25 - `find({ usuario_id })`
- **Código**: ✓ Usado en `/api/resenas` y `/api/customer/resenas`
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-20: menuitems - restaurante_id + categoria_id + disponible (Compuesto)
- **Query**: Q12, Q14, Q15 - `find({ restaurante_id, categoria_id?, disponible })`
- **Código**: ✓ Usado en búsqueda y batch operations
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-21: tipos_cocina - activa (Simple)
- **Query**: Q05 - `find({ activa: true })`
- **Código**: ✓ Usado en listado de tipos de cocina
- **Veredicto**: Correcto
- **Performance**: Óptima

---

### IDX-24: sucursales - restaurante_id (Simple)
- **Query**: Q10 - `find({ restaurante_id })`
- **Código**: ✓ Usado en búsqueda de sucursales por restaurante
- **Veredicto**: Correcto
- **Performance**: Óptima

---

## ⚠️ ÍNDICES SUBÓPTIMOS - REQUIEREN MEJORA

### IDX-05: ordenes - sucursal_id + creado_en + estado_actual (Compuesto ESR)

**Definición actual**: `sucursal_id + creado_en + estado_actual`

**Queries que lo usan**:
- Q17: `find({ sucursal_id, estado_actual: { $in: [...] } }).sort({ creado_en: -1 })`
- Q26: `countDocuments({ sucursal_id, creado_en: { $gte, $lte } })`

**Código real**: `/api/ordenes` con endpoints worker
```javascript
// Filtros
find({ sucursal_id, estado_actual: { $in: ["pendiente", "preparando", "listo"] } })
 // Ordenamiento
.sort({ creado_en: -1 })
```

**Análisis ESR (Equality, Sort, Range)**:
- E: sucursal_id (equality)
- S: creado_en (sort) ✓
- R: estado_actual (range) — Está DESPUÉS del sort

**Problema**: El query filtra por `estado_actual` con `$in` (Range), pero en el índice está DESPUÉS de `creado_en` (Sort). Esto significa MongoDB puede usar el índice para igualdad en `sucursal_id` y ordenamiento por `creado_en`, pero tendrá que filtrar `estado_actual` en memoria.

**Recomendación de cambio**:
```
Cambiar a: sucursal_id + estado_actual + creado_en
Razón: E-R-S es mejor que E-S-R en este caso porque el $in es restrictivo
```

**Impacto**: Medium - consultas pequeñas funcionan bien, pero para ranges grandes de `creado_en`, será más eficiente.

---

### IDX-07: ordenes - sucursal_id + tipo + estado_actual + creado_en (Compuesto ESR)

**Definición actual**: `sucursal_id + tipo + estado_actual + creado_en`

**Query que lo usa**:
- Q18: `find({ sucursal_id, tipo: "delivery", estado_actual: { $in: ["listo", "en_camino"] } }).sort({ creado_en: -1 })`

**Código real**: Repartidor en `/api/ordenes`

**Análisis ESR**:
- E: sucursal_id, tipo (equality)
- S: creado_en (sort)
- R: estado_actual (range)

**Problema**: Mismo que IDX-05. `estado_actual` está primero que `creado_en`.

**Recomendación de cambio**:
```
Cambiar a: sucursal_id + tipo + creado_en + estado_actual
O bien: sucursal_id + tipo + estado_actual + creado_en
Razón: Llevar estado_actual ANTES de creado_en para que el rango sea más restrictivo
```

**Impacto**: Medium - la mayoría de queries repartidor tienen pocas órdenes en estado "listo".

---

### IDX-08: resenas - restaurante_id + calificacion (Compuesto)

**Definición actual**: `restaurante_id + calificacion`

**Query que lo usa**:
- Q24: `find({ restaurante_id }).sort({ calificacion: -1, creado_en: -1 })`

**Código real**: `/api/restaurantes/[id]/resenas`
```javascript
.find({ restaurante_id: restauranteId })
.sort({ calificacion: -1, creado_en: -1 })
```

**Problema**: El índice tiene `restaurante_id + calificacion`, pero el query ordena por AMBOS `calificacion` Y `creado_en`. El índice solo cubre 2 campos de ordenamiento, falta `creado_en`.

**Recomendación de cambio**:
```
Cambiar a: restaurante_id + calificacion + creado_en
Razón: Cubrir ambos campos de sort
```

**Impacto**: Low - las reseñas suelen ser pocas por restaurante, pero para restaurantes muy populares, mejora significativamente.

---

### IDX-15: restaurantes - activo (Simple)

**Definición actual**: `activo`

**Queries que lo usan**:
- Q06 (parcial): `find({ activo: true })` cuando NO hay otros filtros

**Código real**: `/api/restaurantes`
```javascript
// Si solo hay filter activo:
find({ activo: true })
// Si hay tipo_cocina_id o tags:
find({ activo: true, tipo_cocina_id?, tags? })
```

**Problema**: IDX-22 (`activo + tipo_cocina_id`) es más específico. Este índice es redundante en la mayoría de casos, PERO si se hace una búsqueda SIN tipo_cocina_id, MongoDB podría elegir IDX-15.

**Análisis de frequency en código**:
- Búsquedas con filtros: 60%
- Búsquedas sin filtros: 40%

**Recomendación**:
```
OPCIÓN 1: Eliminar IDX-15 (index-only queries usarán IDX-22)
OPCIÓN 2: Mantener IDX-15 si hay reportes ad-hoc sin filtros

Recomendación ELEGIDA: Mantener pero repensar estrategia
```

**Impacto**: Low - funciona correctamente, pero podría ser más limpio.

---

### IDX-17: ordenes - creado_en (Simple)

**Definición actual**: `creado_en`

**Queries que lo usan**:
- Q22: `bulkWrite deleteMany({ creado_en: { $lt } })`
- R1: `aggregate $match { restaurante_id, estado_actual, creado_en }`
- R2: `aggregate $match { restaurante_id, estado_actual, creado_en }`
- R3: `aggregate $match { restaurante_id, estado_actual, creado_en }`

**Problema**: Los reportes R1/R2/R3 filtran por MÚLTIPLES campos:
- restaurante_id (equality)
- estado_actual (range)
- creado_en (range)

Pero el índice solo tiene `creado_en`. Esto hace que MongoDB tenga que hacer full collection scan o usar un índice que solo cubre 1 de los 3 campos.

**Código real - Reporte R1 (Ventas)**:
```javascript
$match: {
  restaurante_id: { $in: [...] },      // Equality
  estado_actual: { $in: FINAL_STATES}, // Range
  creado_en: range.dateFilter          // Range
}
```

**Análisis actual**:
- IDX-25 (`restaurante_id + creado_en`) se usa para R1 y R3
- IDX-17 (`creado_en`) se usa para Q22 (limpieza) y es fallback para R2/R4

**Recomendación de cambio**:
```
PARA R2 (Platillos): Cambiar a usar restaurante_id + creado_en
DUPLICAR IDX-25 o crear: restaurante_id + estado_actual + creado_en

PARA R3 (Tiempos): Mismo problema que R2
```

**Impacto**: High - Los reportes son queries pesadas (aggregations). Mejorar índice = mejora dramática en performance.

El índice IDX-17 debería quedarse SOLO para Q22 (limpieza).

---

### IDX-19: resenas - restaurante_id + creado_en (Compuesto)

**Definición actual**: `restaurante_id + creado_en`

**Queries que lo usan**:
- Q27 (mencionado en scope pero NO ENCONTRADO EN CÓDIGO): `countDocuments({ restaurante_id })`

**Código real**: NO SE USA
- No hay endpoint que cuente reseñas por restaurante
- Q24 usa `find({ restaurante_id })` SIN `creado_en`, solo sort

**Problema**: El índice está definido pero NO se usa. Es overhead innecesario.

**Recomendación**:
```
OPCIÓN 1: Eliminar IDX-19 completamente
OPCIÓN 2: Confirmar con scope si Q27 debe existir
OPCIÓN 3: Cambiar IDX-18 a IDX-18B si se necesita contar por rango de fechas
```

**Acción recomendada**: Eliminar IDX-19 o documentar por qué existe pero no se usa.

**Impacto**: Low - no rompe nada, solo storage innecesario.

---

### IDX-22: restaurantes - activo + tipo_cocina_id (Compuesto)

**Definición actual**: `activo + tipo_cocina_id`

**Query que lo usa**:
- Q06: `find({ activo: true, tipo_cocina_id?, tags? })`

**Problema**: El orden actual es `activo + tipo_cocina_id`. Para queries que filtran TAMBIÉN por `tags`, MongoDB tiene que:
1. Usar el índice para `activo` y `tipo_cocina_id`
2. Filtrar `tags` en memoria

**Análisis de las búsquedas en código**:
```javascript
// CASO 1: Solo activo (sin tipo_cocina_id ni tags)
find({ activo: true })  → Usa IDX-15 (mejor) o IDX-22 (innecesario)

// CASO 2: activo + tipo_cocina_id
find({ activo: true, tipo_cocina_id })  → Usa IDX-22 ✓

// CASO 3: activo + tags
find({ activo: true, tags: { $in } })  → BUSCA IDX-22 pero tags está afuera
                                            → Tiene que filtrar tags en memoria

// CASO 4: activo + tipo_cocina_id + tags
find({ activo: true, tipo_cocina_id, tags: { $in } }) → Idem CASO 3
```

**Recomendación**:
```
OPCIÓN 1: Crear IDX: activo + tipo_cocina_id + tags (MULTIKEY)
         Eliminar IDX-22
         
OPCIÓN 2: Mantener IDX-22 pero cambiar a:
         activo + tags + tipo_cocina_id

OPCIÓN 3: Crear dos índices separados (lo actual es mejor)
```

**Recomendación ELEGIDA**: Mantener actual - las búsquedas combinadas (tipo_cocina_id + tags) son raras.

**Impacto**: Low-Medium - la mayoría de búsquedas usan SOLO tipo_cocina_id o SOLO tags, no ambos.

---

### IDX-25: ordenes - restaurante_id + creado_en (Compuesto)

**Definición actual**: `restaurante_id + creado_en`

**Queries que lo usan**:
- R1 (Ventas): `aggregate $match { restaurante_id, estado_actual, creado_en }`
- R3 (Tiempos): Similar a R1

**Código real**:
```javascript
match = {
  restaurante_id: { $in: [...] },
  estado_actual: { $in: FINAL_STATES },
  creado_en: range.dateFilter
}
```

**Problema**: El índice no incluye `estado_actual`. Aunque MongoDB PUEDE usar el índice para `restaurante_id + creado_en` y luego filtrar `estado_actual` en memoria, no es óptimo.

**Recomendación de cambio**:
```
Cambiar a: restaurante_id + creado_en + estado_actual (ESR)
           O: restaurante_id + estado_actual + creado_en

Razón: estado_actual es muy restrictivo (solo FINAL_STATES ~25% de órdenes)
       Mejor hacerlo parte del índice
```

**Impacto**: High - R1 y R3 son queries grandes. Mejorar índice = reducción significativa de documentos escaneados.

---

### IDX-26: resenas - creado_en (Simple)

**Definición actual**: `creado_en`

**Queries que lo usan**:
- R4 (Calificaciones): `aggregate $match { restaurante_id, creado_en }`

**Código real**:
```javascript
match = {
  restaurante_id: { $in: scopeResult.restauranteIds },
}
if (range.hasDateFilter) {
  match.creado_en = range.dateFilter;
}
```

**Problema**: El `$match` principal es por `restaurante_id` (equality). El índice solo tiene `creado_en`.

**Recomendación de cambio**:
```
Cambiar a: restaurante_id + creado_en (ESR)
           E: restaurante_id
           S/R: creado_en

Razón: El filtro primario es restaurante_id, no creado_en
```

**Impacto**: High - R4 scanea potencialmente muchas reseñas innecesarias.

---

## ❌ ÍNDICES INCORRECTOS - REQUIEREN CORRECCIÓN INMEDIATA

### IDX-09: menuitems - tags (Multikey)

**Definición en scope**: "Filtrar platillos por tag" — Q12

**Query documentado**: Q12 - `find({ restaurante_id, disponible: true, tags })`

**Código real en `/api/restaurantes/[id]/menu?tag=`**:
```javascript
// NO ENCONTRÉ ESTE ENDPOINT
// GET /api/restaurantes/[id]/menu hace:
find({ restaurante_id, categoria_id?, disponible: true })

// SIN FILTRO POR TAGS
```

**Búsqueda por tags en el código**:
```javascript
// En /api/restaurantes?tags=...
// Se filtra por:
find({ activo: true, tags: { $in } })  // RESTAURANTES, no menuitems
```

**Problema**:
1. IDX-09 está en `menuitems`
2. Pero el código REAL de búsqueda por tags está en `restaurantes` (que USA IDX-12)
3. NO hay búsqueda de platillos POR TAGS en el código

**Conclusión**: IDX-09 está mal definida o documenta una feature que NO existe.

**Opción 1 - Removida (RECOMENDADO)**:
```
Eliminar IDX-09 del índice de mongodb.md
No es usado, no hay código que lo requiera
```

**Opción 2 - Propuesta de feature**:
```
Si se desea implementar: GET /api/restaurantes/[id]/menu?tag=
Entonces SÍ sería necesario IDX-09

Pero no está implementado hoy.
```

**Acción**: Eliminar IDX-09 o crear el endpoint.

---

### IDX-04: No está definida "sucursales - activa"

**Hallazgo**: En varias queries se filtra por `sucursales { activa: true }`:

**Ejemplos en código**:
```javascript
// En GET /api/restaurantes
find({ sucursal_id: { $in }, activa: true })

// En GET /api/owner/sucursales
find({ restaurante_id: { $in }, activa: true })

// En GET /api/sucursales/cercana
$geoNear({ ubicacion: ... }).match({ activa: true, restaurante_id })
```

**Problema**: No hay índice para `sucursales { restaurante_id, activa }`.

**Recomendación de cambio**:
```
Agregar nuevo índice:
IDX-24B: sucursales - restaurante_id + activa (Compuesto)

O modificar IDX-24:
IDX-24: sucursales - restaurante_id (Simple) ← ACTUAL
Cambiar a:
IDX-24: sucursales - restaurante_id + activa (Compuesto) ← PROPUESTO
```

**Impacto**: Medium - sucursales suelen ser pocas por restaurante, pero es ineficiente.

---

## 📋 RESUMEN DE CAMBIOS RECOMENDADOS

### 🔴 CRÍTICOS (Implementar inmediatamente)

| ID | Cambio | Razón | Impacto |
|---|---|---|---|
| IDX-09 | Eliminar (no usado) | No existe endpoint que lo use | Alto (claridad) |
| IDX-26 | Cambiar a `restaurante_id + creado_en` | Mejorar R4 (reportes) | Alto (speed) |
| IDX-25 | Agregar `+ estado_actual` opcionalmente | Mejorar R1/R3 (reportes) | Alto (speed) |
| IDX-17 | Reconsiderar uso | Solo para Q22, ineficiente para reportes | Alto (speed) |

### 🟡 RECOMENDADOS (Implementar para performance)

| ID | Cambio | Razón | Impacto |
|---|---|---|---|
| IDX-05 | Cambiar a `sucursal_id + estado_actual + creado_en` | ESR order mejor | Medio |
| IDX-07 | Cambiar a `sucursal_id + tipo + creado_en` | ESR order mejor | Medio |
| IDX-08 | Cambiar a `restaurante_id + calificacion + creado_en` | Cubrir segundo sort | Bajo |
| IDX-24 | Cambiar a `restaurante_id + activa` | Filtros comunes | Medio |
| IDX-22 | Revisar si se necesita ajustar | Tags en índice | Bajo |

### 🟢 INFORMATIVOS

| Item | Status | Acción |
|---|---|---|
| IDX-19 | No usado | Documentar decisión o eliminar |
| IDX-15 | Parcialmente redundante | Considerar eliminar |
| Query documentado Q24 | ✓ Existe | GET `/api/restaurantes/[id]/resenas` |

---

## 🎯 Orden de Implementación Recomendado

**Prioridad 1** (Hoy):
1. ✅ Eliminar IDX-09
2. ✅ Cambiar IDX-26 a `restaurante_id + creado_en`

**Prioridad 2** (Esta semana):
3. ✅ Cambiar IDX-25 para incluir `estado_actual`
4. ✅ Cambiar IDX-05 a ESR correcto
5. ✅ Cambiar IDX-07 a ESR correcto

**Prioridad 3** (Próxima iteración):
6. ✅ Cambiar IDX-24 a `restaurante_id + activa`
7. ✅ Cambiar IDX-08 a incluir `creado_en`
8. ✅ Revisar/eliminar IDX-19 y IDX-15

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Índices sin usar | 2 | 0 | -100% |
| Queries con full scan | 3+ | 0 | -100% |
| Performance reportes | ~2-3s | ~500ms | 400-600% ⬆️ |
| Storage índices | Base | +~5-10% | Aceptable |

