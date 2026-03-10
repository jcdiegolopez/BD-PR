## 2.2 Estructura de Documentos

Colección: restaurantes
```json
{
	"_id": ObjectId(),
	"nombre": "Asados Rosales",
	"descripcion": "Autenticos asados desde 2004",
	"tipo_cocina_id": ObjectId(),        // Ref a tipos_cocina
	"imagen_portada_id": ObjectId(),     // Ref a GridFS
	"propietario_id": ObjectId(),        // Ref a usuario con rol owner
	"sitio_web": "https://asadosrosales.com",
	"tags": ["carne", "asado", "familiar"],
	"calificacion_promedio": NumberDecimal("4.2"),
	"total_resenas": 150,
	"activo": true,
	"creado_en": ISODate()
}
```

Colección: sucursales
```json
{
	"_id": ObjectId(),
	"restaurante_id": ObjectId(),        // Ref al restaurante padre
	"nombre": "Zona 10",
	"direccion": {
		"calle": "6a Avenida 12-31",
		"zona": "Zona 10",
		"ciudad": "Guatemala City"
	},
	"ubicacion": {                       // GeoJSON — indice 2dsphere aqui
		"type": "Point",
		"coordinates": [-90.5069, 14.5994]
	},
	"telefono": "+502 2234-5678",
	"horario": { "apertura": "07:00", "cierre": "23:00" },
	"activa": true,
	"creado_en": ISODate()
}
```

Colección: tipos_cocina
```json
{
	"_id": ObjectId(),
	"nombre": "Mexicana",
	"slug": "mexicana",
	"descripcion": "Tacos, burritos, enchiladas y mas",
	"imagen_banner_id": ObjectId(),      // Banner de categoria (GridFS)
	"activa": true,
	"creado_en": ISODate()
}
```

Colección: usuarios
```json
{
	"_id": ObjectId(),
	"nombre": "Carlos Perez",
	"email": "carlos@email.com",
	"password_hash": "hashed_string",
	"rol": "worker",  // admin | owner | worker | repartidor | customer
	"telefono": "+502 5555-1234",
	"sucursal_asignada": ObjectId(),     // Ref a sucursales (worker/repartidor)
																			 // null para admin, owner, customer
	"foto_perfil_id": null,              // Ref a GridFS
	"direcciones_guardadas": [           // Solo para customers
		{
			"alias": "Casa",
			"texto": "6a Avenida 12-31, Zona 10",
			"ubicacion": { "type": "Point", "coordinates": [-90.5069, 14.5994] },
			"predeterminada": true
		}
	],
	"activo": true,
	"creado_en": ISODate()
}
```

Colección: categorias
```json
{
	"_id": ObjectId(),
	"restaurante_id": ObjectId(),        // A que restaurante pertenece
	"nombre": "Tacos",
	"descripcion": "Tacos artesanales de distintos guisos",
	"orden_display": 1,
	"activa": true,
	"creado_en": ISODate()
}
```
no te hueco rindas
Colección: menuitems
```json
{
	"_id": ObjectId(),
	"restaurante_id": ObjectId(),
	"categoria_id": ObjectId(),
	"nombre": "Taco de Res",
	"descripcion": "Taco con carne de res, cilantro y salsa verde",
	"precio": NumberDecimal("45.00"),
	"imagen_id": ObjectId(),             // Ref a GridFS
	"tags": ["bestseller", "carne", "sin gluten"],
	"opciones": [
		{ "nombre": "Salsa", "valores": ["verde","roja","sin salsa"], "requerido": true }
	],
	"disponible": true,
	"creado_en": ISODate()
}
```

Colección: ordenes
```json
{
	"_id": ObjectId(),
	"restaurante_id": ObjectId(),        // Ref a restaurantes
	"sucursal_id": ObjectId(),           // Ref a sucursales (coleccion independiente)
	"usuario_id": ObjectId(),
	"tipo": "delivery",                  // pickup | delivery
	"items": [
		{
			"menuitem_id": ObjectId(),
			"nombre": "Taco de Res",
			"precio_unitario": NumberDecimal("45.00"),
			"cantidad": 2,
			"subtotal": NumberDecimal("90.00"),
			"opciones_elegidas": { "Salsa": "verde" }
		}
	],
	"monto_total": NumberDecimal("90.00"),
	"estado_actual": "pendiente",
	"historial_estados": [
		{ "estado": "pendiente", "timestamp": ISODate(), "cambiado_por": null }
	],
	"direccion_entrega": {               // null si tipo es pickup
		"texto": "6a Avenida 12-31, Zona 10",
		"ubicacion": { "type": "Point", "coordinates": [-90.5069, 14.5994] }
	},
	"notas": "Sin pepinillos",
	"creado_en": ISODate()
}
```

Colección: resenas
```json
{
	"_id": ObjectId(),
	"usuario_id": ObjectId(),
	"restaurante_id": ObjectId(),        // A cual restaurante va la resena
	"orden_id": ObjectId(),              // Valida que hizo orden previa
	"calificacion": 4,                  // Entero 1-5
	"comentario": "Muy buenos tacos, servicio rapido.",
	"fotos_ids": [],                    // Array de ref a GridFS (opcional)
	"util_count": 0,
	"creado_en": ISODate()
}
```


## 


## 🗂️ Queries e Índices

### Catálogo de Queries

| ID  | Colección   | Operación                                              | Índice usado          |
|-----|-------------|--------------------------------------------------------|-----------------------|
| Q01 | usuarios    | `findOne({ email })`                                   | IDX-01                |
| Q02 | usuarios    | `findOne({ _id })`                                     | PK                    |
| Q03 | usuarios    | `find({ rol, activo })`                                | IDX-02                |
| Q04 | usuarios    | `find({ sucursal_asignada })`                          | IDX-10                |
| Q05 | tipos_cocina| `find({ activa: true })`                               | IDX-21                |
| Q06 | restaurantes| `find({ activo, tipo_cocina_id?, tags? })`             | IDX-15 / IDX-22 / IDX-12 |
| Q07 | restaurantes| `$text { $search }`                                    | IDX-14                |
| Q08 | restaurantes| `findOne({ _id })`                                     | PK                    |
| Q09 | sucursales  | `$geoNear({ ubicacion })`                              | IDX-11                |
| Q10 | sucursales  | `find({ restaurante_id })`                             | IDX-24                |
| Q11 | categorias  | `find({ restaurante_id, activa: true })`               | IDX-16                |
| Q12 | menuitems   | `find({ restaurante_id, categoria_id?, disponible })`  | IDX-20                |
| Q13 | menuitems   | `$text { $search }`                                    | IDX-13                |
| Q14 | menuitems   | `insertMany`                                           | IDX-20                |
| Q15 | menuitems   | `updateMany({ restaurante_id, categoria_id }, $mul precio))`         | IDX-20                |
| Q16 | ordenes     | `insertOne` — T2                                       | IDX-05                |
| Q17 | ordenes     | `find({ sucursal_id, estado_actual: $in, sort: fecha })`| IDX-05               |
| Q18 | ordenes     | `find({ sucursal_id, tipo: "delivery", estado_actual })`| IDX-07               |
| Q19 | ordenes     | `find({ usuario_id, estado_actual? })`                 | IDX-06                |
| Q20 | ordenes     | `findOne({ _id })`                                     | PK                    |
| Q21 | ordenes     | `updateOne({ _id }, $set + $push)` — T3                | PK                    |
| Q22 | ordenes     | `bulkWrite deleteMany`                                 | IDX-17                |
| Q23 | resenas     | `insertOne` — T1                                       | IDX-18                |
| Q24 | resenas     | `find({ restaurante_id, sort: calificacion })`         | IDX-08                |
| Q25 | resenas     | `find({ usuario_id })`                                 | IDX-18                |
| Q26 | ordenes     | `countDocuments({ sucursal_id, creado_en })`           | IDX-05                |
| Q27 | resenas     | `countDocuments({ restaurante_id })`                   | IDX-19                |

---

### Índices Definidos

| ID     | Colección    | Campos                                        | Tipo         | Query       |
|--------|--------------|-----------------------------------------------|--------------|-------------|
| IDX-01 | usuarios     | `email`                                       | Simple único | Q01         |
| IDX-02 | usuarios     | `rol + activo`                                | Compuesto    | Q03         |
| IDX-05 | ordenes      | `sucursal_id + creado_en + estado_actual`     | Compuesto ESR| Q16,Q17,Q26 |
| IDX-06 | ordenes      | `usuario_id + estado_actual`                  | Compuesto    | Q19         |
| IDX-07 | ordenes      | `sucursal_id + tipo + estado_actual`          | Compuesto    | Q18         |
| IDX-08 | resenas      | `restaurante_id + calificacion`               | Compuesto    | Q24         |
| IDX-09 | menuitems    | `tags`                                        | Multikey     | Q12         |
| IDX-10 | usuarios     | `sucursal_asignada`                           | Simple       | Q04         |
| IDX-11 | sucursales   | `ubicacion`                                   | 2dsphere     | Q09         |
| IDX-12 | restaurantes | `tags`                                        | Multikey     | Q06         |
| IDX-13 | menuitems    | `nombre + descripcion`                        | Texto        | Q13         |
| IDX-14 | restaurantes | `nombre + descripcion`                        | Texto        | Q07         |
| IDX-15 | restaurantes | `activo`                                      | Simple       | Q06         |
| IDX-16 | categorias   | `restaurante_id + activa`                     | Compuesto    | Q11         |
| IDX-17 | ordenes      | `creado_en`                                   | Simple       | Q22, R1-R4  |
| IDX-18 | resenas      | `usuario_id`                                  | Simple       | Q23,Q25     |
| IDX-19 | resenas      | `restaurante_id + creado_en`                  | Compuesto    | Q27         |
| IDX-20 | menuitems    | `restaurante_id + categoria_id + disponible`  | Compuesto    | Q12,Q14,Q15 |
| IDX-21 | tipos_cocina | `activa`                                      | Simple       | Q05         |
| IDX-22 | restaurantes | `activo + tipo_cocina_id`                     | Compuesto    | Q06         |
| IDX-24 | sucursales   | `restaurante_id`                              | Simple       | Q10         |
| IDX-25 | ordenes      | `restaurante_id + creado_en`                  | Compuesto    | R1, R3      |
| IDX-26 | resenas      | `creado_en`                                   | Simple       | R4          |

---

### Queries por Rol

| Rol        | Queries propios                                      | Queries compartidos         |
|------------|------------------------------------------------------|-----------------------------|
| Customer   | Q05,Q07,Q09,Q11,Q12,Q13,Q16,Q19,Q23,Q24,Q25        | Q01,Q02,Q08,Q10,Q20         |
| Worker     | Q17,Q26                                              | Q01,Q02,Q10,Q20,Q21         |
| Repartidor | Q18                                                  | Q01,Q02,Q10,Q20,Q21         |
| Owner      | Q14,Q15                                              | Q01,Q02,Q08,Q10,Q11,Q12     |
| Admin      | Q03,Q04,Q22                                          | Q01,Q02,Q06,Q10,Q15         |

---

### Reportes Analíticos (Aggregation Pipelines)

| ID | Descripción                          | Colección base | Índice principal |
|----|--------------------------------------|----------------|------------------|
| R1 | Ventas por restaurante en fechas     | ordenes        | IDX-25           |
| R2 | Top 10 platillos más vendidos        | ordenes        | IDX-17           |
| R3 | Tiempo promedio por estado/sucursal  | ordenes        | IDX-17           |
| R4 | Calificación promedio por restaurante| resenas        | IDX-26           |
