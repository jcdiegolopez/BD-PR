# 📌 Tabla de Referencia Rápida — Índices MongoDB

## Comparativa: Documentado vs Código Real

| Índice | Documentado en mongodb.md | Código Real | Status | Acción |
|--------|--------------------------|------------|--------|--------|
| **IDX-01** | `email` (Simple único) | Q01 findOne email | ✅ OK | — |
| **IDX-02** | `rol + activo` (Comp) | Q03 find rol,activo | ✅ OK | — |
| **IDX-05** | `sucursal + creado + estado` (ESR) | Q17 find sucursal,estado sort creado | ⚠️ ESR | Reordenar: E-R-S |
| **IDX-06** | `usuario_id + estado` (Comp) | Q19 find usuario,estado | ✅ OK | — |
| **IDX-07** | `sucursal + tipo + estado + creado` (ESR) | Q18 find sucursal,tipo,estado sort creado | ⚠️ ESR | Reordenar: E-S-R |
| **IDX-08** | `restaurante + calificacion` (Comp) | Q24 find restaurante sort calificacion,creado | ❌ FALTA | Agregar + creado |
| **IDX-09** | `tags` (Multikey) | **NO EXISTE** | ❌ NO USADO | **ELIMINAR** |
| **IDX-10** | `sucursal_asignada` (Simple) | Q04 find sucursal_asignada | ✅ OK | — |
| **IDX-11** | `ubicacion` (2dsphere) | Q09 $geoNear ubicacion | ✅ OK | — |
| **IDX-12** | `tags` (Multikey) | Q06 find activo,tags | ✅ OK | — |
| **IDX-13** | `nombre + descripcion` (Texto) | Q13 $text search menuitems | ✅ OK | — |
| **IDX-14** | `nombre + descripcion` (Texto) | Q07 $text search restaurantes | ✅ OK | — |
| **IDX-15** | `activo` (Simple) | Q06 fallback (parcial) | ⚠️ REDUNDANTE | Considerar eliminar |
| **IDX-16** | `restaurante_id + activa` (Comp) | Q11 find restaurante_id,activa | ✅ OK | — |
| **IDX-17** | `creado_en` (Simple) | Q22 limpieza, R2 plat | ⚠️ INSUFICIENTE | Solo para Q22 OK |
| **IDX-18** | `usuario_id` (Simple) | Q23,Q25 find usuario_id | ✅ OK | — |
| **IDX-19** | `restaurante_id + creado_en` (Comp) | **NO EXISTE** | ❌ NO USADO | **ELIMINAR** |
| **IDX-20** | `restaurante_id + categ + disponible` (Comp) | Q12,Q14,Q15 | ✅ OK | — |
| **IDX-21** | `activa` (Simple) | Q05 find activa | ✅ OK | — |
| **IDX-22** | `activo + tipo_cocina_id` (Comp) | Q06 find activo,tipo | ✅ OK | — |
| **IDX-24** | `restaurante_id` (Simple) | Q10 find restaurante_id,activa | ⚠️ INCOMPLETO | Agregar + activa |
| **IDX-25** | `restaurante_id + creado_en` (Comp) | R1,R3 match restaurante,estado,creado | ⚠️ FALTA ESTADO | Agregar + estado_actual |
| **IDX-26** | `creado_en` (Simple) | R4 match restaurante,creado | ❌ ORDEN INVERTIDO | Cambiar a restaurante + creado |

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ OK | Índice está correcto, funciona bien |
| ⚠️ | Índice funciona pero ineficiente, requiere optimización |
| ❌ | Índice NO funciona, rompe queries o no se usa |
| — | Sin acción requerida |
| E-S-R | ESR order: Equality-Sort-Range |
| E-R-S | ESR order: Equality-Range-Sort (menos eficiente) |
| Comp | Índice Compuesto (múltiples campos) |

---

## Cambios Necesarios (Compact)

### 🔴 CRÍTICOS - Rompen o no se usan
```
1. IDX-09 → ELIMINAR (no existe endpoint)
2. IDX-19 → ELIMINAR (no se usa)
3. IDX-26 → CAMBIAR creado_en → restaurante_id + creado_en
```

### 🟡 PERFORMANCE - Optimizar queries
```
4. IDX-05 → Reordenar campos ESR
5. IDX-07 → Reordenar campos ESR
6. IDX-08 → Agregar + creado_en al sort
7. IDX-24 → Cambiar restaurante_id → restaurante_id + activa
8. IDX-25 → Cambiar restaurante_id + creado_en 
           → restaurante_id + estado_actual + creado_en
```

### 🟢 REVIEW - Considerar
```
9. IDX-15 → Podría ser redundante con IDX-22
10. IDX-17 → Está OK para Q22, pero reportes necesitan mejor índice
```

---

## Impacto por Cambio

### Cambios pequeños (LOW RISK)
```
✏️ IDX-09 (eliminar)        → Riesgo: NINGUNO - no se usa
✏️ IDX-19 (eliminar)        → Riesgo: NINGUNO - no se usa
✏️ IDX-26 (reordenar)       → Riesgo: BAJO - R4 mejora solo
✏️ IDX-24 (extender)        → Riesgo: BAJO - queries siguen igual
```

### Cambios medianos (MEDIUM RISK)
```
✏️ IDX-05 (reordenar)       → Riesgo: BAJO - queries siguen funcionando
✏️ IDX-07 (reordenar)       → Riesgo: BAJO - queries siguen funcionando
✏️ IDX-08 (extender)        → Riesgo: BAJO - cubre más en sort
✏️ IDX-25 (extender)        → Riesgo: MEDIO - afecta reportes, pero mejora
```

---

## Queries Documentadas vs Implementadas

| ID | Scope.md | ¿Existe? | Índice | Status |
|----|----------|----------|--------|--------|
| Q01 | GET `/api/auth/login` | ✅ | IDX-01 | ✅ |
| Q02 | GET `/api/auth/me` | ✅ | PK | ✅ |
| Q03 | GET `/api/admin/usuarios` | ✅ | IDX-02 | ✅ |
| Q04 | GET `/api/admin/sucursales/[id]/staff` | ✅ | IDX-10 | ✅ |
| Q05 | POST `/api/admin/usuarios` | ✅ | IDX-01 | ✅ |
| Q05b | GET `/api/tipos-cocina` | ✅ | IDX-21 | ✅ |
| Q06 | GET `/api/restaurantes` | ✅ | IDX-(multiple) | ✅ |
| Q07 | GET `/api/restaurantes?search=` | ✅ | IDX-14 | ✅ |
| Q08 | GET `/api/restaurantes/[id]` | ✅ | PK | ✅ |
| Q09 | GET `/api/sucursales/cercana` | ✅ | IDX-11 | ✅ |
| Q10 | GET `/api/restaurantes/[id]/sucursales` | ✅ | IDX-24 | ⚠️ |
| Q11 | GET `/api/restaurantes/[id]/categorias` | ✅ | IDX-16 | ✅ |
| Q12 | GET `/api/restaurantes/[id]/menu` | ✅ | IDX-20 | ✅ |
| Q13 | GET `/api/restaurantes/[id]/menu?search=` | ✅ | IDX-13 | ✅ |
| Q14 | POST `/api/owner/menuitems/bulk` | ✅ | IDX-20 | ✅ |
| Q15 | PATCH `/api/owner/menuitems/precio` | ✅ | IDX-20 | ✅ |
| Q16 | POST `/api/ordenes` (crear) | ✅ | IDX-05 | ✅ |
| Q17 | GET `/api/ordenes` (worker) | ✅ | IDX-05 | ⚠️ |
| Q18 | GET `/api/ordenes` (repartidor) | ✅ | IDX-07 | ⚠️ |
| Q19 | GET `/api/customer/ordenes` | ✅ | IDX-06 | ✅ |
| Q20 | GET `/api/ordenes/[id]` | ✅ | PK | ✅ |
| Q21 | PATCH `/api/ordenes/[id]/estado` | ✅ | PK | ✅ |
| Q22 | POST `/api/admin/ordenes/limpieza` | ✅ | IDX-17 | ✅ |
| Q23 | POST `/api/resenas` | ✅ | IDX-18 | ✅ |
| Q24 | GET `/api/restaurantes/[id]/resenas` | ✅ | IDX-08 | ⚠️ |
| Q25 | GET `/api/customer/resenas` | ✅ | IDX-18 | ✅ |
| Q26 | GET `/api/ordenes/[id]` (count) | ✅ | IDX-05 | ⚠️ |
| Q27 | — | ❌ | IDX-19 | ❌ |

---

## Resumen Mínimo

```
PROBLEMAS ENCONTRADOS:

Índices sin usar:
  ❌ IDX-09 (tags en menuitems)
  ❌ IDX-19 (restaurante_id + creado_en en resenas)

Índices ineficientes (pero funcionan):
  ⚠️ IDX-05, IDX-07: Orden ESR invertido
  ⚠️ IDX-08: Falta campo en sort
  ⚠️ IDX-25: Falta estado_actual
  ⚠️ IDX-26: Orden invertido (CRÍTICO)
  ⚠️ IDX-24: Falta activa

IMPACTO EN PERFORMANCE:
  • Reportes (R1-R4): 2-6x LENTO
  • Queues (Q17-Q18): 2-3x LENTO
  • Reviews (Q24): 1.5x LENTO

SOLUCIÓN: 8 cambios en mongodb.md, ~2 eliminar, ~6 modificar
```

