# Scope del Proyecto — Sistema de Gestión de Pedidos y Reseñas
> CC3089 Base de Datos 2 · Next.js App Router · MongoDB driver nativo · Atlas replica set

---

## Descripción general
Plataforma de delivery y pickup estilo Rappi con múltiples restaurantes independientes. Cada restaurante tiene sucursales físicas propias. Workers y repartidores están asignados a una sucursal específica, no al restaurante completo.

**Roles:** `admin` `owner` `worker` `repartidor` `customer`

---

## Flujos por rol

### customer
1. Explora restaurantes — filtra por tipo de cocina, tag o búsqueda de texto, con paginación
2. Entra al detalle de un restaurante — ve menú por categorías, puede buscar platillos o filtrar por tag
3. Al hacer pedido elige **delivery** o **pickup**
   - delivery → app detecta ubicación → se recomienda la sucursal más cercana via `$geoNear`
   - pickup → elige sucursal manualmente de la lista
4. Confirma orden → transacción T2 (valida disponibilidad + snapshot de precios)
5. Sigue el estado de su orden
6. Al completarse → puede dejar reseña → transacción T1
7. Puede agregar y eliminar direcciones guardadas en su perfil (máx 5)

### worker
1. Login → carga su sucursal asignada
2. Ve la cola de órdenes de su sucursal (pendiente / preparando), ordenada por fecha
3. Gestiona cada orden: `pendiente → preparando → listo → completado` (pickup)
4. Cambio de estado via transacción T3

### repartidor
1. Login → carga su sucursal asignada
2. Ve órdenes delivery con estado `listo` de su sucursal
3. Gestiona cada orden: `listo → en_camino → entregado`
4. Cambio de estado via transacción T3

### owner
1. Login → carga su restaurante
2. Ve sus sucursales
3. Gestiona su menú: alta masiva de platillos con `insertMany`, ajuste de precios masivo con `updateMany`
4. Ve reportes R1–R4 de su restaurante

### admin
1. Login
2. Crea usuarios
3. Lista usuarios por rol / ve staff de una sucursal
4. Lista restaurantes
5. Ve reportes R1–R4 globales
6. Ejecuta limpieza histórica de órdenes via `bulkWrite`

---

## Endpoints y queries

### Auth
| Método | Endpoint | Descripción | Query | Índice |
|---|---|---|---|---|
| POST | `/api/auth/login` | Login con email y password | Q01 `findOne({ email })` | IDX-01 |
| GET | `/api/auth/me` | Cargar usuario de la sesión activa | Q02 `findOne({ _id })` | PK |

### Público
| Método | Endpoint | Descripción | Query | Índice |
|---|---|---|---|---|
| GET | `/api/tipos-cocina` | Listar todos los tipos de cocina activos | Q05 `find({ activa: true })` | IDX-21 |
| GET | `/api/restaurantes` | Listar restaurantes con filtros y paginación | Q06 `find({ activo: true, tipo_cocina_id?, tags? })` | IDX-15 / IDX-22 / IDX-12 |
| GET | `/api/restaurantes?search=` | Buscar restaurantes por nombre o descripción | Q07 `find({ activo: true, $text: { $search } })` | IDX-14 |
| GET | `/api/restaurantes/[id]` | Detalle de un restaurante | Q08 `findOne({ _id, activo: true })` | PK |
| GET | `/api/restaurantes/[id]/sucursales` | Listar sucursales de un restaurante | Q10 `find({ restaurante_id, activa: true })` | IDX-24 |
| GET | `/api/restaurantes/[id]/categorias` | Listar categorías activas del menú | Q11 `find({ restaurante_id, activa: true })` | IDX-16 |
| GET | `/api/restaurantes/[id]/menu` | Platillos disponibles, filtrables por categoría | Q12 `find({ restaurante_id, categoria_id?, disponible: true })` | IDX-20 |
| GET | `/api/restaurantes/[id]/menu?search=` | Buscar platillo por nombre o descripción | Q13 `find({ restaurante_id, disponible: true, $text: { $search } })` | IDX-13 |
| GET | `/api/restaurantes/[id]/menu?tag=` | Filtrar platillos por tag | Q12 `find({ restaurante_id, disponible: true, tags })` | IDX-09 |
| GET | `/api/restaurantes/[id]/resenas` | Reseñas del restaurante ordenadas por calificación | Q24 `find({ restaurante_id, sort: calificacion })` | IDX-08 |
| GET | `/api/sucursales/cercana?lng=&lat=` | Sucursal más cercana a una coordenada dada | Q09 `$geoNear({ ubicacion })` | IDX-11 |

### Customer
| Método | Endpoint | Descripción | Query | Índice |
|---|---|---|---|---|
| POST | `/api/ordenes` | Crear nueva orden — T2 | Q16 `insertOne` | IDX-05 |
| GET | `/api/customer/ordenes` | Listar mis órdenes, filtrable por estado | Q19 `find({ usuario_id, estado_actual? })` | IDX-06 |
| GET | `/api/ordenes/[id]` | Detalle de una orden | Q20 `findOne({ _id })` | PK |
| POST | `/api/resenas` | Crear reseña de una orden completada — T1 | Q23 `insertOne` | IDX-18 |
| GET | `/api/customer/resenas` | Listar mis reseñas | Q25 `find({ usuario_id })` | IDX-18 |
| POST | `/api/customer/direcciones` | Agregar dirección guardada al perfil | `$push direcciones_guardadas` | PK |
| DELETE | `/api/customer/direcciones/[alias]` | Eliminar dirección guardada por alias | `$pull direcciones_guardadas` | PK |


### Worker
| Método | Endpoint | Descripción | Query | Índice | Implementación |
|---|---|---|---|---|---|
| GET | `/api/ordenes` <br>(con rol worker) | Cola de órdenes activas de su sucursal (pendientes, preparando, listos) | Q17 `find({ sucursal_id, estado_actual: ... })` <br>Q26 `countDocuments({ sucursal_id, creado_en })` | IDX-05 | [src/app/api/ordenes/route.js](../src/app/api/ordenes/route.js) <br>Función: `handleWorkerOrders` <br>Llamado desde frontend: [src/app/(worker)/cola/page.js](../src/app/(worker)/cola/page.js) |
| GET | `/api/ordenes/[id]` | Detalle de una orden | Q20 `findOne({ _id })` | PK | [src/app/api/ordenes/[id]/route.js](../src/app/api/ordenes/[id]/route.js) |
| PATCH | `/api/ordenes/[id]/estado` | Cambiar estado de una orden — T3 (transacción) | Q21 `updateOne` <br>+ validaciones de transición y sucursal <br>+ `$push` historial | PK | [src/app/api/ordenes/[id]/estado/route.js](../src/app/api/ordenes/[id]/estado/route.js) <br>Usa sesión y transacción MongoDB |

**Notas:**
- El frontend del worker ([src/app/(worker)/cola/page.js](../src/app/(worker)/cola/page.js)) consume `/api/ordenes` para mostrar la cola y `/api/ordenes/[id]/estado` para avanzar el estado.
- El query Q17 se usa para obtener órdenes por estado (`pendiente`, `preparando`, `listo`) y Q26 para los conteos diarios, ambos usando el índice IDX-05.
- El cambio de estado (PATCH) se realiza dentro de una transacción (T3) en el backend, asegurando atomicidad y consistencia.
- No existe endpoint `/api/worker/cola` ni `/api/worker/cola/count`; la funcionalidad está centralizada en `/api/ordenes` con autenticación de rol worker.


### Repartidor
| Método | Endpoint | Descripción | Query | Índice | Implementación |
|---|---|---|---|---|---|
| GET | `/api/ordenes` <br>(con rol repartidor) | Órdenes delivery listas para entregar de su sucursal | Q18 `find({ sucursal_id, tipo: "delivery", estado_actual: ... })` | IDX-07 | [src/app/api/ordenes/route.js](../src/app/api/ordenes/route.js) <br>Función: `handleRepartidorOrders` |
| GET | `/api/ordenes/[id]` | Detalle de una orden con dirección de entrega | Q20 `findOne({ _id })` | PK | [src/app/api/ordenes/[id]/route.js](../src/app/api/ordenes/[id]/route.js) |
| PATCH | `/api/ordenes/[id]/estado` | Cambiar estado de una orden — T3 (transacción) | Q21 `updateOne` <br>+ validaciones de transición y sucursal <br>+ `$push` historial | PK | [src/app/api/ordenes/[id]/estado/route.js](../src/app/api/ordenes/[id]/estado/route.js) <br>Usa sesión y transacción MongoDB |


**Notas:**
- El endpoint `/api/ordenes` con autenticación de rol `repartidor` implementa la lógica de la cola de órdenes delivery listas para entregar, usando el query Q18 e índice IDX-07.
- El detalle de la orden (`GET /api/ordenes/[id]`) es consumido desde el frontend de repartidor ([src/app/(repartidor)/entregas/page.js](../src/app/(repartidor)/entregas/page.js)), mostrando la información en un modal al presionar "Ver detalle".
- El cambio de estado (`PATCH /api/ordenes/[id]/estado`) también es consumido desde la misma interfaz, permitiendo avanzar el estado de la orden.
- No existe endpoint `/api/repartidor/cola`; la funcionalidad está centralizada en `/api/ordenes`.

### Owner
| Método | Endpoint | Descripción | Query | Índice |
|---|---|---|---|---|
| POST | `/api/owner/menuitems/bulk` | Alta masiva de platillos nuevos — 4.5 | Q14 `insertMany` | IDX-20 |
| PATCH | `/api/owner/menuitems/precio` | Aplicar aumento u oferta de precio a todos los items de una categoría — 4.6 | Q15 `updateMany({ restaurante_id, categoria_id }, $mul precio)` | IDX-20 |
| GET | `/api/reportes/ventas?desde=&hasta=` | R1 — ventas por restaurante en rango de fechas | R1 | IDX-25 |
| GET | `/api/reportes/platillos?desde=&hasta=` | R2 — top 10 platillos más vendidos | R2 | IDX-17 |
| GET | `/api/reportes/tiempos?desde=&hasta=` | R3 — tiempo promedio por estado por sucursal | R3 | IDX-17 |
| GET | `/api/reportes/calificaciones?desde=&hasta=` | R4 — calificación promedio por restaurante | R4 | IDX-26 |

### Admin
| Método | Endpoint | Descripción | Query | Índice |
|---|---|---|---|---|
| GET | `/api/admin/usuarios` | Listar usuarios filtrados por rol | Q03 `find({ rol, activo })` | IDX-02 |
| GET | `/api/admin/sucursales/[id]/staff` | Ver workers y repartidores de una sucursal | Q04 `find({ sucursal_asignada })` | IDX-10 |
| POST | `/api/admin/usuarios` | Crear nuevo usuario con cualquier rol | Q05 `insertOne` | IDX-01 |
| POST | `/api/admin/ordenes/limpieza` | Limpiar órdenes históricas viejas — 4.4 | Q22 `bulkWrite deleteMany` | IDX-17 |
| GET | `/api/reportes/*` | Todos los reportes R1–R4 con vista global | R1–R4 | IDX-25/17/26 |

---

## Paginación — solo en `/api/restaurantes`
```
?page=1                               default 1
?limit=10                             default 10, máximo 20
?sort=calificacion_promedio | nombre  default calificacion_promedio desc
?tipo_cocina_id=                      filtro opcional — IDX-22
?tags=                                filtro opcional — IDX-12 Multikey
?search=                              búsqueda texto — IDX-14, no combina con sort
```
Respuesta: `{ data, total, page, limit, totalPages }`  
Implementar con `skip = (page - 1) * limit`

---

## Operaciones especiales

| ID | Tipo | Descripción |
|---|---|---|
| T1 | Transacción | `insertOne` en resenas + `updateOne` calificacion_promedio en restaurantes |
| T2 | Transacción | Validar items disponibles + snapshot precios + `insertOne` en ordenes |
| T3 | Transacción | Validar transición + validar sucursal + `updateOne` estado + `$push` historial |
| 4.4 | BulkWrite | Dos `deleteMany` en ordenes — completadas/entregadas con +3 años, pendientes con +30 días |
| 4.5 | insertMany | Alta masiva de platillos nuevos en menuitems |
| 4.6 | updateMany | Aumento u oferta de precio en todos los items de una categoría — body: `{ categoria_id, tipo: "aumento" \| "oferta", porcentaje: number }` |

---

## Direcciones del customer
- `POST /api/customer/direcciones` → `$push` al array `direcciones_guardadas`
- `DELETE /api/customer/direcciones/[alias]` → `$pull` filtrando por `alias`
- Máximo 5 — validado por JSON Schema
- Si `predeterminada: true`, hacer `$set` a false en las demás antes del push

---

## Fuera del scope
- Editar usuarios, restaurantes, sucursales, categorías o menuitems individualmente
- Delete de cualquier colección excepto la limpieza de órdenes via bulkWrite
- Crear menuitem individual — solo insertMany
- Update o delete de reseñas
- Paginación en endpoints que no sean `/api/restaurantes`
- Listado público de usuarios