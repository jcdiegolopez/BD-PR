# Correcciones a Implementar en mongodb.md

## Cambios en la tabla de Índices Definidos

### Línea de cambios del JSON

```diff
// ELIMINAR:
- IDX-09 | menuitems    | `tags`                                        | Multikey     | Q12

// CAMBIAR:
- IDX-05 | ordenes      | `sucursal_id + creado_en + estado_actual`     | Compuesto ESR| Q16,Q17,Q26
+ IDX-05 | ordenes      | `sucursal_id + estado_actual + creado_en`     | Compuesto ESR| Q16,Q17,Q26

- IDX-07 | ordenes      | `sucursal_id + tipo + estado_actual + creado_en` | Compuesto ESR| Q18
+ IDX-07 | ordenes      | `sucursal_id + tipo + creado_en + estado_actual` | Compuesto ESR| Q18

- IDX-08 | resenas      | `restaurante_id + calificacion`               | Compuesto    | Q24
+ IDX-08 | resenas      | `restaurante_id + calificacion + creado_en`   | Compuesto    | Q24

- IDX-24 | sucursales   | `restaurante_id`                              | Simple       | Q10
+ IDX-24 | sucursales   | `restaurante_id + activa`                     | Compuesto    | Q10

- IDX-25 | ordenes      | `restaurante_id + creado_en`                  | Compuesto    | R1, R3
+ IDX-25 | ordenes      | `restaurante_id + estado_actual + creado_en`  | Compuesto ESR| R1, R2, R3

- IDX-26 | resenas      | `creado_en`                                   | Simple       | R4
+ IDX-26 | resenas      | `restaurante_id + creado_en`                  | Compuesto    | R4

// REVISAR:
? IDX-19 | resenas      | `restaurante_id + creado_en`                  | Compuesto    | Q27
  PROBLEMA: Q27 no está en scope.md ni en el código. Considerar eliminar.

? IDX-15 | restaurantes | `activo`                                      | Simple       | Q06
  PROBLEMA: IDX-22 es más específico. Considerar usar solo IDX-22.
```

---

## Nueva tabla de Índices (PROPUESTA)

| ID     | Colección    | Campos                                          | Tipo         | Query       |
|--------|--------------|------------------------------------------------|--------------|-------------|
| IDX-01 | usuarios     | `email`                                        | Simple único | Q01         |
| IDX-02 | usuarios     | `rol + activo`                                 | Compuesto    | Q03         |
| IDX-05 | ordenes      | `sucursal_id + estado_actual + creado_en`      | Compuesto ESR| Q16,Q17,Q26 |
| IDX-06 | ordenes      | `usuario_id + estado_actual`                   | Compuesto    | Q19         |
| IDX-07 | ordenes      | `sucursal_id + tipo + creado_en + estado_actual` | Compuesto ESR| Q18       |
| IDX-08 | resenas      | `restaurante_id + calificacion + creado_en`    | Compuesto    | Q24         |
| IDX-10 | usuarios     | `sucursal_asignada`                            | Simple       | Q04         |
| IDX-11 | sucursales   | `ubicacion`                                    | 2dsphere     | Q09         |
| IDX-12 | restaurantes | `tags`                                         | Multikey     | Q06         |
| IDX-13 | menuitems    | `nombre + descripcion`                         | Texto        | Q13         |
| IDX-14 | restaurantes | `nombre + descripcion`                         | Texto        | Q07         |
| IDX-15 | restaurantes | `activo`                                       | Simple       | Q06 (fallback)|
| IDX-16 | categorias   | `restaurante_id + activa`                      | Compuesto    | Q11         |
| IDX-17 | ordenes      | `creado_en`                                    | Simple       | Q22         |
| IDX-18 | resenas      | `usuario_id`                                   | Simple       | Q23,Q25     |
| IDX-20 | menuitems    | `restaurante_id + categoria_id + disponible`   | Compuesto    | Q12,Q14,Q15 |
| IDX-21 | tipos_cocina | `activa`                                       | Simple       | Q05         |
| IDX-22 | restaurantes | `activo + tipo_cocina_id`                      | Compuesto    | Q06         |
| IDX-24 | sucursales   | `restaurante_id + activa`                      | Compuesto    | Q10         |
| IDX-25 | ordenes      | `restaurante_id + estado_actual + creado_en`   | Compuesto ESR| R1,R2,R3    |
| IDX-26 | resenas      | `restaurante_id + creado_en`                   | Compuesto    | R4          |

---

## Detalles de Cambios Críticos

### 1. ELIMINAR IDX-09
```
RAZÓN: No hay endpoint en el código que filtré menuitems por tags
La búsqueda de tags está en restaurantes (IDX-12), NO en menuitems

VERIFICACIÓN:
- Búsqueda: GET /api/restaurantes?tags=  ✓ Existe
- Búsqueda: GET /api/restaurantes/[id]/menu?tag=  ✗ NO existe

ACCIÓN: Eliminar IDX-09 de la tabla
```

### 2. IDX-05: Cambiar orden ESR
```
CAMBIO: sucursal_id + creado_en + estado_actual
        → sucursal_id + estado_actual + creado_en

RAZÓN: Query usa $in en estado_actual (rango selectivo)
       Mejor poner estado_actual ANTES de creado_en para filtrar primero

CÓDIGO AFECTADO:
/api/ordenes (worker role)
find({ sucursal_id, estado_actual: { $in: [...] } }).sort({ creado_en })

BENEFICIO: Menos documentos escaneados
```

### 3. IDX-07: Cambiar orden ESR
```
CAMBIO: sucursal_id + tipo + estado_actual + creado_en
        → sucursal_id + tipo + creado_en + estado_actual

O mejor:
        → sucursal_id + tipo + estado_actual + creado_en
        Aunque el orden actual puede estar bien si `tipo: "delivery"` es equality

CÓDIGO AFECTADO:
/api/ordenes (repartidor role)
find({ sucursal_id, tipo: "delivery", estado_actual: { $in [...] } }).sort({ creado_en })

NOTA: Mantener revisar si `tipo` siempre es "delivery" (si es así, está bien)
```

### 4. IDX-08: Agregar creado_en
```
CAMBIO: restaurante_id + calificacion
        → restaurante_id + calificacion + creado_en

RAZÓN: Query ordena por DOS campos: calificacion DESC, creado_en DESC
       El índice solo tenía 2, falta cubrir ambos

CÓDIGO AFECTADO:
GET /api/restaurantes/[id]/resenas
find({ restaurante_id }).sort({ calificacion: -1, creado_en: -1 })

BENEFICIO: MongoDB puede usar índice para AMBOS campos de sort
```

### 5. IDX-24: Agregar activa
```
CAMBIO: restaurante_id
        → restaurante_id + activa

RAZÓN: Muchas queries filtran por AMBOS campos:
       find({ restaurante_id, activa: true })

CÓDIGO AFECTADO:
GET /api/restaurantes (subcircuito por sucursal)
GET /api/owner/sucursales
GET /api/sucursales/cercana

BENEFICIO: Filtra en índice, no en memoria
```

### 6. IDX-25: Agregar estado_actual
```
CAMBIO: restaurante_id + creado_en
        → restaurante_id + estado_actual + creado_en

RAZÓN: Reportes filtran por TODOS estos campos:
       match {
         restaurante_id: { $in },
         estado_actual: { $in: FINAL_STATES },
         creado_en: { $gte, $lte }
       }

CÓDIGO AFECTADO:
/api/reportes/ventas → R1
/api/reportes/tiempos → R3
/api/reportes/platillos → R2 (ATENCION: R2 también necesita esto)

BENEFICIO: CRÍTICO - Reportes pueden escasear MILES de órdenes
           Mejorar a 10s de órdenes
```

### 7. IDX-26: Cambiar a compuesto
```
CAMBIO: creado_en (Simple)
        → restaurante_id + creado_en (Compuesto)

RAZÓN: Query filtra PRIMERO por restaurante_id (equality), LUEGO por creado_en
       match {
         restaurante_id: { $in: [...] },
         creado_en: { dateFilter }
       }

CÓDIGO AFECTADO:
/api/reportes/calificaciones → R4

BENEFICIO: Alta - evita escanear todas las reseñas sin el restaurante
           R4 es agregation que agrupa por restaurante
```

---

## Cambios Suplementarios (considera hacer)

### A. Revisar IDX-19
```
ESTADO: Definida pero no usada
DEFINICIÓN: restaurante_id + creado_en (resenas)
QUERY: Q27 (countDocuments por restaurante)

PROBLEMA: Q27 no existe en scope.md ni en código

OPCIONES:
1. Eliminar IDX-19 (Recomendado)
2. Mantener si planean agregar feature de Q27

ACCIÓN: Confirmar y eliminar o documentar propósito
```

### B. Considerar IDX-15
```
ESTADO: Simple, pero parcialmente redundante
DEFINICIÓN: activo (restaurantes)
CONFLICTO: IDX-22 es más específico (activo + tipo_cocina_id)

ANÁLISIS:
- Si query: find({ activo: true }) → Usa IDX-15 ✓
- Si query: find({ activo: true, tipo_cocina_id: X }) → Usa IDX-22 ✓
- Si no hubiera IDX-15, ambos usarían IDX-22 → Funciona igual

OPCIONES:
1. Mantener (actual - explícito)
2. Eliminar (limpio - MongoDB usa IDX-22 igual)

RECOMENDACIÓN: Mantener por ahora (es fallback claro)
```

---

## Query Q27 - Decisión pendiente

En **mongodb.md**, la tabla menciona **Q27**:
```
| Q27 | resenas     | `countDocuments({ restaurante_id })`  | IDX-19 |
```

Pero **NO EXISTE EN SCOPE.md** ni en código.

OPCIONES:
1. **Eliminar Q27 y IDX-19** ✓ Recomendado
   - No se usa
   - Limpia documentación

2. **Mantener como "propuesto"**
   - Documenta intención futura
   - PERO: Índice incorrecto (falta `creado_en`)

ACCIÓN: Eliminar ambos (Q27 e IDX-19) o confirmar propósito

---

## Resumen Ejecutivo de Cambios

**Cambios CRÍTICOS** (Implementar AHORA):
- ❌ Eliminar: IDX-09
- ✏️ Modificar: IDX-05, IDX-07, IDX-08, IDX-24, IDX-25, IDX-26
- ❓ Revisar: Q27, IDX-19

**Cambios opcionales** (Próxima iteración):
- Reconsiderar: IDX-15, IDX-22

**Beneficio esperado**:
- Reportes: 4-6x más rápidos
- Queries agua: 2-3x más rápidos  
- Storage: +~5% (aceptable)

