
## 📁 Estructura de Carpetas

```
whenever-bites/
├── src/
│   ├── app/
│   │   ├── api/                           ← API Routes (backend)
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── route.js           ← POST /api/auth/login
│   │   │   ├── restaurantes/
│   │   │   │   └── route.js               ← GET /api/restaurantes
│   │   │   ├── sucursales/
│   │   │   │   └── route.js               ← GET /api/sucursales
│   │   │   ├── categorias/
│   │   │   │   └── route.js               ← GET /api/categorias
│   │   │   ├── tipos-cocina/
│   │   │   │   └── route.js               ← GET /api/tipos-cocina
│   │   │   ├── menuitems/
│   │   │   │   └── route.js               ← GET POST PUT /api/menuitems
│   │   │   ├── ordenes/
│   │   │   │   └── route.js               ← GET POST PATCH /api/ordenes
│   │   │   ├── resenas/
│   │   │   │   └── route.js               ← GET POST /api/resenas
│   │   │   └── usuarios/
│   │   │       └── route.js               ← GET /api/usuarios
│   │   │
│   │   ├── (auth)/                        ← Público, sin protección
│   │   │   └── login/
│   │   │       └── page.jsx               ← Todos los roles entran aquí
│   │   │
│   │   ├── (customer)/                    ← Solo rol: customer
│   │   │   ├── home/
│   │   │   │   └── page.jsx               ← Tipos cocina + lista restaurantes (Q05, Q06)
│   │   │   ├── restaurante/
│   │   │   │   └── [id]/
│   │   │   │       └── page.jsx           ← Detalle + menú + reseñas (Q08, Q11, Q12, Q24)
│   │   │   ├── checkout/
│   │   │   │   └── page.jsx               ← Confirmar orden T2 (Q16)
│   │   │   ├── mis-ordenes/
│   │   │   │   └── page.jsx               ← Historial órdenes (Q19, Q20)
│   │   │   └── resena/
│   │   │       └── page.jsx               ← Crear reseña T1 (Q23)
│   │   │
│   │   ├── (worker)/                      ← Solo rol: worker
│   │   │   └── cola/
│   │   │       └── page.jsx               ← Cola órdenes + cambio estado T3 (Q17, Q20, Q21, Q26)
│   │   │
│   │   ├── (repartidor)/                  ← Solo rol: repartidor
│   │   │   └── entregas/
│   │   │       └── page.jsx               ← Órdenes delivery + cambio estado T3 (Q18, Q20, Q21)
│   │   │
│   │   ├── (owner)/                       ← Solo rol: owner
│   │   │   └── menu/
│   │   │       └── page.jsx               ← CRUD menú, insertMany, updateMany (Q11,Q12,Q14,Q15)
│   │   │
│   │   ├── (admin)/                       ← Solo rol: admin
│   │   │   ├── usuarios/
│   │   │   │   └── page.jsx               ← Listar usuarios por rol (Q03, Q04)
│   │   │   ├── restaurantes/
│   │   │   │   └── page.jsx               ← CRUD restaurantes (Q06, Q08)
│   │   │   └── limpieza/
│   │   │       └── page.jsx               ← BulkWrite histórico (Q22)
│   │   │
│   │   ├── reportes/                      ← Compartida: owner + admin
│   │   │   └── page.jsx                   ← R1, R2, R3, R4
│   │   │
│   │   └── layout.jsx                     ← Layout raíz
│   │
│   └── lib/
│       ├── mongodb.js                     ← Conexión singleton a MongoDB
│       ├── auth.js                        ← Firmar y verificar JWT
│       └── middleware.js                  ← Protección de rutas por rol
│
├── .env.local                             ← MONGODB_URI + JWT_SECRET
└── package.json
```
