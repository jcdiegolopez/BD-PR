# Scope del Proyecto — Sistema de Gestión de Pedidos y Reseñas
> CC3089 Base de Datos 2 · Next.js App Router · MongoDB driver nativo · Atlas replica set

---

## Descripción general
Plataforma de delivery y pickup estilo Rappi/Uber Eats con múltiples restaurantes independientes. Cada restaurante tiene sucursales físicas propias. Los workers y repartidores están asignados a una sucursal específica, no al restaurante completo.

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
5. Sigue el estado de su orden en tiempo real
6. Al completarse → puede dejar reseña → transacción T1
7. Puede agregar y eliminar direcciones guardadas en su perfil (máx 5)

### worker
1. Login → carga su sucursal asignada
2. Ve la cola de órdenes de su sucursal (pendiente / preparando), ordenada por fecha
3. Gestiona cada orden: `pendiente → preparando → listo → completado` (pickup)
4. Cambio de estado via transacción T3 (valida transición + valida que la orden pertenece a su sucursal)

### repartidor
1. Login → carga su sucursal asignada
2. Ve órdenes delivery con estado `listo` de su sucursal
3. Gestiona cada orden: `listo → en_camino → entregado`
4. Cambio de estado via transacción T3

### owner
1. Login → carga su restaurante
2. Ve sus sucursales
3. Gestiona su menú: categorías, platillos (alta masiva con `insertMany`, edición individual, desactivar categoría masivo con `updateMany`)
4. Ve reportes R1–R4 filtrados por su restaurante

### admin
1. Login
2. Gestiona restaurantes (crear, editar)
3. Gestiona sucursales (crear, editar, asignar)
4. Gestiona usuarios (crear, editar, listar por rol, ver staff de sucursal)
5. Ve todos los reportes R1–R4 globales
6. Ejecuta limpieza histórica de órdenes (`bulkWrite`)

---

## Endpoints definidos

### Auth
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login por email + password |
| GET | `/api/auth/me` | Cargar sesión activa |

### Público
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/tipos-cocina` | Listar tipos de cocina activos |
| GET | `/api/restaurantes` | Listar restaurantes con paginación y filtros |
| GET | `/api/restaurantes/[id]` | Detalle de restaurante |
| GET | `/api/restaurantes/[id]/sucursales` | Sucursales de un restaurante |
| GET | `/api/restaurantes/[id]/categorias` | Categorías activas del menú |
| GET | `/api/restaurantes/[id]/menu` | Platillos — acepta `?categoria_id=` `?search=` `?tag=` |
| GET | `/api/restaurantes/[id]/resenas` | Reseñas del restaurante |
| GET | `/api/sucursales/cercana` | Sucursal más cercana — requiere `?lng=&lat=` |

### Customer
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/ordenes` | Crear orden — T2 |
| GET | `/api/customer/ordenes` | Mis órdenes — acepta `?estado=` |
| GET | `/api/ordenes/[id]` | Detalle de orden |
| POST | `/api/resenas` | Crear reseña — T1 |
| GET | `/api/customer/resenas` | Mis reseñas |
| POST | `/api/customer/direcciones` | Agregar dirección guardada |
| DELETE | `/api/customer/direcciones/[alias]` | Eliminar dirección guardada |

### Worker
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/worker/cola` | Cola de órdenes de su sucursal |
| GET | `/api/worker/cola/count` | Count de órdenes activas hoy |
| GET | `/api/ordenes/[id]` | Detalle de orden |
| PATCH | `/api/ordenes/[id]/estado` | Cambiar estado — T3 |

### Repartidor
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/repartidor/cola` | Órdenes delivery listas de su sucursal |
| GET | `/api/ordenes/[id]` | Detalle de orden |
| PATCH | `/api/ordenes/[id]/estado` | Cambiar estado — T3 |

### Owner
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/restaurantes/[id]/sucursales` | Sus sucursales |
| GET | `/api/restaurantes/[id]/categorias` | Sus categorías |
| POST | `/api/owner/categorias` | Crear categoría |
| PATCH | `/api/owner/categorias/[id]` | Editar categoría |
| PATCH | `/api/owner/categorias/[id]/toggle` | Desactivar categoría masivo — updateMany |
| GET | `/api/restaurantes/[id]/menu` | Su menú |
| POST | `/api/owner/menuitems/bulk` | Alta masiva de platillos — insertMany |
| PATCH | `/api/owner/menuitems/[id]` | Editar platillo individual |
| GET | `/api/reportes/ventas` | R1 — acepta `?desde=&hasta=` |
| GET | `/api/reportes/platillos` | R2 — acepta `?desde=&hasta=` |
| GET | `/api/reportes/tiempos` | R3 — acepta `?desde=&hasta=` |
| GET | `/api/reportes/calificaciones` | R4 — acepta `?desde=&hasta=` |

### Admin
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/admin/usuarios` | Listar usuarios por rol |
| POST | `/api/admin/usuarios` | Crear usuario |
| PATCH | `/api/admin/usuarios/[id]` | Editar usuario |
| GET | `/api/admin/sucursales/[id]/staff` | Ver staff de una sucursal |
| POST | `/api/admin/restaurantes` | Crear restaurante |
| PATCH | `/api/admin/restaurantes/[id]` | Editar restaurante |
| POST | `/api/admin/sucursales` | Crear sucursal |
| PATCH | `/api/admin/sucursales/[id]` | Editar sucursal |
| POST | `/api/admin/ordenes/limpieza` | Limpieza histórica — bulkWrite |
| GET | `/api/reportes/*` | Todos los reportes — vista global |

---

## Paginación — solo en `/api/restaurantes`
```
?page=1                               default 1
?limit=10                             default 10, máximo 20
?sort=calificacion_promedio | nombre  default calificacion_promedio desc
?tipo_cocina_id=                      filtro opcional
?tags=                                filtro opcional (array Multikey)
?search=                              búsqueda texto (no combina con sort)
```
Respuesta: `{ data, total, page, limit, totalPages }`

---

## Operaciones especiales

| ID | Tipo | Colección | Endpoint |
|---|---|---|---|
| T1 | Transacción | resenas + restaurantes | `POST /api/resenas` |
| T2 | Transacción | menuitems + ordenes | `POST /api/ordenes` |
| T3 | Transacción | ordenes | `PATCH /api/ordenes/[id]/estado` |
| 4.4 | BulkWrite | ordenes | `POST /api/admin/ordenes/limpieza` |
| 4.5 | insertMany | menuitems | `POST /api/owner/menuitems/bulk` |
| 4.6 | updateMany | menuitems | `PATCH /api/owner/categorias/[id]/toggle` |

---

## Lo que no está en el scope

- Delete de cualquier colección excepto limpieza histórica de órdenes vía bulkWrite
- CRUD completo — solo las operaciones listadas arriba
- Crear menuitem individual — solo alta masiva con insertMany
- Update o delete de reseñas
- Update de órdenes fuera del cambio de estado
- Listado público de usuarios
- Paginación en endpoints que no sean `/api/restaurantes`