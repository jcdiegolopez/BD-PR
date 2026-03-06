// =============================================================
//  seed.js — whenever-bites
//  Pobla todas las colecciones con datos de prueba realistas
//  Uso: node seed.js
// =============================================================

const { MongoClient, ObjectId, Decimal128 } = require("mongodb");
const bcrypt = require("bcryptjs");
const dns = require("node:dns");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "whenever-bites";
const dnsServers = process.env.MONGODB_DNS_SERVERS;

if (!uri) throw new Error("MONGODB_URI no está definido en .env.local");

if (uri.startsWith("mongodb+srv://") && dnsServers) {
  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

// ── Helpers ───────────────────────────────────────────────────
const dec = (v) => Decimal128.fromString(String(v));
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

// ── IDs fijos para poder cruzar referencias ───────────────────

// Tipos de cocina
const tcIds = {
  mexicana: new ObjectId(),
  italiana: new ObjectId(),
  guatemalteca: new ObjectId(),
  americana: new ObjectId(),
  japonesa: new ObjectId(),
};

// Usuarios
const uIds = {
  admin: new ObjectId(),
  owner1: new ObjectId(),
  owner2: new ObjectId(),
  worker1: new ObjectId(),
  worker2: new ObjectId(),
  repartidor1: new ObjectId(),
  repartidor2: new ObjectId(),
  customer1: new ObjectId(),
  customer2: new ObjectId(),
  customer3: new ObjectId(),
};

// Restaurantes
const rIds = {
  asados: new ObjectId(),
  pizza: new ObjectId(),
  chuchito: new ObjectId(),
};

// Sucursales
const sIds = {
  asados_z10: new ObjectId(),
  asados_z14: new ObjectId(),
  pizza_z9: new ObjectId(),
  chuchito_z4: new ObjectId(),
};

// Categorías
const catIds = {
  asados_carnes: new ObjectId(),
  asados_bebidas: new ObjectId(),
  pizza_clasicas: new ObjectId(),
  pizza_especiales: new ObjectId(),
  chuchito_entradas: new ObjectId(),
  chuchito_platos: new ObjectId(),
};

// Menú items
const miIds = {
  asado_res: new ObjectId(),
  churrasco: new ObjectId(),
  limonada: new ObjectId(),
  pizza_marg: new ObjectId(),
  pizza_4q: new ObjectId(),
  chuchito: new ObjectId(),
  pepian: new ObjectId(),
};

// ── Datos ─────────────────────────────────────────────────────

async function buildUsuarios() {
  const hash = (p) => bcrypt.hashSync(p, 10);
  return [
    {
      _id: uIds.admin,
      nombre: "Ana Administradora",
      email: "admin@wheneverbites.com",
      password_hash: hash("Admin1234!"),
      rol: "admin",
      telefono: "+502 2200-0001",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(90),
    },
    {
      _id: uIds.owner1,
      nombre: "Roberto Rosales",
      email: "roberto@asadosrosales.com",
      password_hash: hash("Owner1234!"),
      rol: "owner",
      telefono: "+502 5511-0001",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(80),
    },
    {
      _id: uIds.owner2,
      nombre: "Lucia Napoli",
      email: "lucia@pizzanapoli.com",
      password_hash: hash("Owner1234!"),
      rol: "owner",
      telefono: "+502 5511-0002",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(75),
    },
    {
      _id: uIds.worker1,
      nombre: "Mario Tzul",
      email: "mario.worker@wheneverbites.com",
      password_hash: hash("Worker1234!"),
      rol: "worker",
      telefono: "+502 5522-0001",
      sucursal_asignada: sIds.asados_z10,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(60),
    },
    {
      _id: uIds.worker2,
      nombre: "Sofía Ajú",
      email: "sofia.worker@wheneverbites.com",
      password_hash: hash("Worker1234!"),
      rol: "worker",
      telefono: "+502 5522-0002",
      sucursal_asignada: sIds.chuchito_z4,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(55),
    },
    {
      _id: uIds.repartidor1,
      nombre: "Pedro Cifuentes",
      email: "pedro.rep@wheneverbites.com",
      password_hash: hash("Rep12345!"),
      rol: "repartidor",
      telefono: "+502 5533-0001",
      sucursal_asignada: sIds.asados_z10,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(50),
    },
    {
      _id: uIds.repartidor2,
      nombre: "Karla Soto",
      email: "karla.rep@wheneverbites.com",
      password_hash: hash("Rep12345!"),
      rol: "repartidor",
      telefono: "+502 5533-0002",
      sucursal_asignada: sIds.pizza_z9,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(45),
    },
    {
      _id: uIds.customer1,
      nombre: "Carlos Pérez",
      email: "carlos@email.com",
      password_hash: hash("Customer1!"),
      rol: "customer",
      telefono: "+502 5544-0001",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [
        {
          alias: "Casa",
          texto: "6a Avenida 12-31, Zona 10, Guatemala City",
          ubicacion: { type: "Point", coordinates: [-90.5069, 14.5994] },
          predeterminada: true,
        },
      ],
      activo: true,
      creado_en: daysAgo(40),
    },
    {
      _id: uIds.customer2,
      nombre: "María González",
      email: "maria@email.com",
      password_hash: hash("Customer1!"),
      rol: "customer",
      telefono: "+502 5544-0002",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [
        {
          alias: "Oficina",
          texto: "4a Calle 7-53, Zona 9, Guatemala City",
          ubicacion: { type: "Point", coordinates: [-90.514, 14.591] },
          predeterminada: true,
        },
      ],
      activo: true,
      creado_en: daysAgo(35),
    },
    {
      _id: uIds.customer3,
      nombre: "José Alvarado",
      email: "jose@email.com",
      password_hash: hash("Customer1!"),
      rol: "customer",
      telefono: "+502 5544-0003",
      sucursal_asignada: null,
      foto_perfil_id: null,
      direcciones_guardadas: [],
      activo: true,
      creado_en: daysAgo(30),
    },
  ];
}

const tipos_cocina = [
  {
    _id: tcIds.mexicana,
    nombre: "Mexicana",
    slug: "mexicana",
    descripcion: "Tacos, burritos, enchiladas y más",
    imagen_banner_id: null,
    activa: true,
    creado_en: daysAgo(100),
  },
  {
    _id: tcIds.italiana,
    nombre: "Italiana",
    slug: "italiana",
    descripcion: "Pizzas, pastas y risottos auténticos",
    imagen_banner_id: null,
    activa: true,
    creado_en: daysAgo(100),
  },
  {
    _id: tcIds.guatemalteca,
    nombre: "Guatemalteca",
    slug: "guatemalteca",
    descripcion: "Pepián, jocon, chuchitos y platillos típicos",
    imagen_banner_id: null,
    activa: true,
    creado_en: daysAgo(100),
  },
  {
    _id: tcIds.americana,
    nombre: "Americana",
    slug: "americana",
    descripcion: "Hamburguesas, hot dogs y comfort food",
    imagen_banner_id: null,
    activa: true,
    creado_en: daysAgo(100),
  },
  {
    _id: tcIds.japonesa,
    nombre: "Japonesa",
    slug: "japonesa",
    descripcion: "Sushi, ramen y tempura",
    imagen_banner_id: null,
    activa: true,
    creado_en: daysAgo(100),
  },
];

const restaurantes = [
  {
    _id: rIds.asados,
    nombre: "Asados Rosales",
    descripcion: "Auténticos asados desde 2004",
    tipo_cocina_id: tcIds.guatemalteca,
    imagen_portada_id: null,
    propietario_id: uIds.owner1,
    sitio_web: "https://asadosrosales.com",
    tags: ["carne", "asado", "familiar"],
    calificacion_promedio: dec("4.2"),
    total_resenas: 0,
    activo: true,
    creado_en: daysAgo(80),
  },
  {
    _id: rIds.pizza,
    nombre: "Pizza Napoli",
    descripcion: "Pizza artesanal al horno de leña",
    tipo_cocina_id: tcIds.italiana,
    imagen_portada_id: null,
    propietario_id: uIds.owner2,
    sitio_web: "https://pizzanapoli.gt",
    tags: ["pizza", "italiana", "delivery"],
    calificacion_promedio: dec("4.5"),
    total_resenas: 0,
    activo: true,
    creado_en: daysAgo(75),
  },
  {
    _id: rIds.chuchito,
    nombre: "El Chuchito Feliz",
    descripcion: "Comida guatemalteca tradicional, recetas de abuela",
    tipo_cocina_id: tcIds.guatemalteca,
    imagen_portada_id: null,
    propietario_id: uIds.owner1,
    sitio_web: null,
    tags: ["tipico", "guatemalteca", "economico"],
    calificacion_promedio: dec("4.7"),
    total_resenas: 0,
    activo: true,
    creado_en: daysAgo(70),
  },
];

const sucursales = [
  {
    _id: sIds.asados_z10,
    restaurante_id: rIds.asados,
    nombre: "Zona 10",
    direccion: { calle: "6a Avenida 12-31", zona: "Zona 10", ciudad: "Guatemala City" },
    ubicacion: { type: "Point", coordinates: [-90.5069, 14.5994] },
    telefono: "+502 2234-5678",
    horario: { apertura: "11:00", cierre: "23:00" },
    activa: true,
    creado_en: daysAgo(80),
  },
  {
    _id: sIds.asados_z14,
    restaurante_id: rIds.asados,
    nombre: "Zona 14",
    direccion: { calle: "15 Avenida 14-20", zona: "Zona 14", ciudad: "Guatemala City" },
    ubicacion: { type: "Point", coordinates: [-90.4978, 14.587] },
    telefono: "+502 2234-5699",
    horario: { apertura: "12:00", cierre: "22:00" },
    activa: true,
    creado_en: daysAgo(60),
  },
  {
    _id: sIds.pizza_z9,
    restaurante_id: rIds.pizza,
    nombre: "Zona 9",
    direccion: { calle: "4a Calle 7-53", zona: "Zona 9", ciudad: "Guatemala City" },
    ubicacion: { type: "Point", coordinates: [-90.514, 14.591] },
    telefono: "+502 2345-6789",
    horario: { apertura: "10:00", cierre: "23:30" },
    activa: true,
    creado_en: daysAgo(75),
  },
  {
    _id: sIds.chuchito_z4,
    restaurante_id: rIds.chuchito,
    nombre: "Zona 4",
    direccion: { calle: "Ruta 4 3-50", zona: "Zona 4", ciudad: "Guatemala City" },
    ubicacion: { type: "Point", coordinates: [-90.51, 14.603] },
    telefono: "+502 2456-7890",
    horario: { apertura: "07:00", cierre: "20:00" },
    activa: true,
    creado_en: daysAgo(70),
  },
];

const categorias = [
  {
    _id: catIds.asados_carnes,
    restaurante_id: rIds.asados,
    nombre: "Carnes a la Parrilla",
    descripcion: "Cortes seleccionados al carbón",
    orden_display: 1,
    activa: true,
    creado_en: daysAgo(80),
  },
  {
    _id: catIds.asados_bebidas,
    restaurante_id: rIds.asados,
    nombre: "Bebidas",
    descripcion: "Refrescos, aguas y más",
    orden_display: 2,
    activa: true,
    creado_en: daysAgo(80),
  },
  {
    _id: catIds.pizza_clasicas,
    restaurante_id: rIds.pizza,
    nombre: "Pizzas Clásicas",
    descripcion: "Las favoritas de siempre",
    orden_display: 1,
    activa: true,
    creado_en: daysAgo(75),
  },
  {
    _id: catIds.pizza_especiales,
    restaurante_id: rIds.pizza,
    nombre: "Pizzas Especiales",
    descripcion: "Creaciones del chef",
    orden_display: 2,
    activa: true,
    creado_en: daysAgo(75),
  },
  {
    _id: catIds.chuchito_entradas,
    restaurante_id: rIds.chuchito,
    nombre: "Entradas",
    descripcion: "Para comenzar bien el día",
    orden_display: 1,
    activa: true,
    creado_en: daysAgo(70),
  },
  {
    _id: catIds.chuchito_platos,
    restaurante_id: rIds.chuchito,
    nombre: "Platos Fuertes",
    descripcion: "La cocina de Guatemala",
    orden_display: 2,
    activa: true,
    creado_en: daysAgo(70),
  },
];

const menuitems = [
  {
    _id: miIds.asado_res,
    restaurante_id: rIds.asados,
    categoria_id: catIds.asados_carnes,
    nombre: "Asado de Res",
    descripcion: "Corte de res a las brasas con chimichurri",
    precio: dec("120.00"),
    imagen_id: null,
    tags: ["carne", "parrilla", "bestseller"],
    opciones: [
      { nombre: "Término", valores: ["3/4", "bien cocido", "al punto"], requerido: true },
      { nombre: "Acompañamiento", valores: ["papas fritas", "arroz", "ensalada"], requerido: true },
    ],
    disponible: true,
    creado_en: daysAgo(80),
  },
  {
    _id: miIds.churrasco,
    restaurante_id: rIds.asados,
    categoria_id: catIds.asados_carnes,
    nombre: "Churrasco Guatemalteco",
    descripcion: "Churrasco marinado con especias locales",
    precio: dec("95.00"),
    imagen_id: null,
    tags: ["carne", "tipico"],
    opciones: [{ nombre: "Término", valores: ["3/4", "bien cocido"], requerido: true }],
    disponible: true,
    creado_en: daysAgo(80),
  },
  {
    _id: miIds.limonada,
    restaurante_id: rIds.asados,
    categoria_id: catIds.asados_bebidas,
    nombre: "Limonada Natural",
    descripcion: "Limonada fresca con limón criollo",
    precio: dec("18.00"),
    imagen_id: null,
    tags: ["bebida", "natural"],
    opciones: [{ nombre: "Azúcar", valores: ["normal", "poca azúcar", "sin azúcar"], requerido: false }],
    disponible: true,
    creado_en: daysAgo(80),
  },
  {
    _id: miIds.pizza_marg,
    restaurante_id: rIds.pizza,
    categoria_id: catIds.pizza_clasicas,
    nombre: "Pizza Margarita",
    descripcion: "Salsa de tomate, mozzarella fresca y albahaca",
    precio: dec("75.00"),
    imagen_id: null,
    tags: ["vegetariana", "clasica"],
    opciones: [
      { nombre: "Tamaño", valores: ["pequeña", "mediana", "grande"], requerido: true },
      { nombre: "Masa", valores: ["delgada", "gruesa"], requerido: true },
    ],
    disponible: true,
    creado_en: daysAgo(75),
  },
  {
    _id: miIds.pizza_4q,
    restaurante_id: rIds.pizza,
    categoria_id: catIds.pizza_especiales,
    nombre: "Pizza 4 Quesos",
    descripcion: "Mozzarella, gorgonzola, parmesano y provolone",
    precio: dec("110.00"),
    imagen_id: null,
    tags: ["queso", "especial", "bestseller"],
    opciones: [{ nombre: "Tamaño", valores: ["mediana", "grande"], requerido: true }],
    disponible: true,
    creado_en: daysAgo(75),
  },
  {
    _id: miIds.chuchito,
    restaurante_id: rIds.chuchito,
    categoria_id: catIds.chuchito_entradas,
    nombre: "Chuchitos (3 unidades)",
    descripcion: "Chuchitos de pollo con recado rojo",
    precio: dec("30.00"),
    imagen_id: null,
    tags: ["tipico", "pollo", "bestseller"],
    opciones: [{ nombre: "Salsa", valores: ["verde", "roja", "ambas"], requerido: false }],
    disponible: true,
    creado_en: daysAgo(70),
  },
  {
    _id: miIds.pepian,
    restaurante_id: rIds.chuchito,
    categoria_id: catIds.chuchito_platos,
    nombre: "Pepián de Pollo",
    descripcion: "Guiso tradicional guatemalteco con pollo y verduras",
    precio: dec("65.00"),
    imagen_id: null,
    tags: ["tipico", "pollo", "sin gluten"],
    opciones: [{ nombre: "Arroz", valores: ["blanco", "frito"], requerido: true }],
    disponible: true,
    creado_en: daysAgo(70),
  },
];

// ── Generador de órdenes (50 000+) ───────────────────────────

const ESTADOS = ["pendiente", "preparando", "listo", "completado"];
const ESTADOS_DELIVERY = ["pendiente", "preparando", "listo", "en_camino", "entregado"];

const PRECIOS_MENU = new Map([
  [miIds.asado_res.toHexString(), dec("120.00")],
  [miIds.churrasco.toHexString(), dec("95.00")],
  [miIds.limonada.toHexString(), dec("18.00")],
  [miIds.pizza_marg.toHexString(), dec("75.00")],
  [miIds.pizza_4q.toHexString(), dec("110.00")],
  [miIds.chuchito.toHexString(), dec("30.00")],
  [miIds.pepian.toHexString(), dec("65.00")],
]);

const NOMBRES_MENU = new Map([
  [miIds.asado_res.toHexString(), "Asado de Res"],
  [miIds.churrasco.toHexString(), "Churrasco Guatemalteco"],
  [miIds.limonada.toHexString(), "Limonada Natural"],
  [miIds.pizza_marg.toHexString(), "Pizza Margarita"],
  [miIds.pizza_4q.toHexString(), "Pizza 4 Quesos"],
  [miIds.chuchito.toHexString(), "Chuchitos (3 unidades)"],
  [miIds.pepian.toHexString(), "Pepián de Pollo"],
]);

function buildOrden(i) {
  const esDelivery = i % 3 !== 0;
  const tipo = esDelivery ? "delivery" : "pickup";

  const configs = [
    { restaurante_id: rIds.asados, sucursal_id: sIds.asados_z10, items: [miIds.asado_res, miIds.limonada] },
    { restaurante_id: rIds.asados, sucursal_id: sIds.asados_z14, items: [miIds.churrasco, miIds.limonada] },
    { restaurante_id: rIds.pizza, sucursal_id: sIds.pizza_z9, items: [miIds.pizza_marg, miIds.pizza_4q] },
    { restaurante_id: rIds.chuchito, sucursal_id: sIds.chuchito_z4, items: [miIds.chuchito, miIds.pepian] },
  ];
  const cfg = configs[i % configs.length];

  const usuarios = [uIds.customer1, uIds.customer2, uIds.customer3];
  const usuario_id = usuarios[i % 3];

  const itemsOrden = cfg.items.map((mid) => {
    const cantidad = (i % 3) + 1;
    const precioUnitario = PRECIOS_MENU.get(mid.toHexString());
    const pu = parseFloat(precioUnitario.toString());
    return {
      menuitem_id: mid,
      nombre: NOMBRES_MENU.get(mid.toHexString()),
      precio_unitario: precioUnitario,
      cantidad,
      subtotal: dec((pu * cantidad).toFixed(2)),
      opciones_elegidas: {},
    };
  });

  const monto_total = dec(itemsOrden.reduce((acc, x) => acc + parseFloat(x.subtotal.toString()), 0).toFixed(2));

  const estados = esDelivery ? ESTADOS_DELIVERY : ESTADOS;
  const estadoIdx = i % estados.length;
  const estadoActual = estados[estadoIdx];

  const creado_en = daysAgo(Math.floor(Math.random() * 60));

  const historial = estados.slice(0, estadoIdx + 1).map((estado, j) => ({
    estado,
    timestamp: new Date(creado_en.getTime() + j * 15 * 60_000),
    cambiado_por: j === 0 ? null : uIds.worker1,
  }));

  return {
    restaurante_id: cfg.restaurante_id,
    sucursal_id: cfg.sucursal_id,
    usuario_id,
    tipo,
    items: itemsOrden,
    monto_total,
    estado_actual: estadoActual,
    historial_estados: historial,
    direccion_entrega: esDelivery
      ? {
          texto: "6a Avenida 12-31, Zona 10, Guatemala City",
          ubicacion: { type: "Point", coordinates: [-90.5069, 14.5994] },
        }
      : null,
    notas: i % 7 === 0 ? "Sin cebolla" : null,
    creado_en,
  };
}

// ── Reseñas ───────────────────────────────────────────────────
function buildResenas() {
  return [
    {
      usuario_id: uIds.customer1,
      restaurante_id: rIds.asados,
      orden_id: new ObjectId(),
      calificacion: 5,
      comentario: "Excelente asado, el chimichurri es increíble. Definitivamente vuelvo.",
      fotos_ids: [],
      util_count: 3,
      creado_en: daysAgo(10),
    },
    {
      usuario_id: uIds.customer2,
      restaurante_id: rIds.asados,
      orden_id: new ObjectId(),
      calificacion: 4,
      comentario: "Muy buen sabor, un poco de espera pero valió la pena.",
      fotos_ids: [],
      util_count: 1,
      creado_en: daysAgo(8),
    },
    {
      usuario_id: uIds.customer1,
      restaurante_id: rIds.pizza,
      orden_id: new ObjectId(),
      calificacion: 5,
      comentario: "La mejor pizza de Guatemala City, masa perfecta.",
      fotos_ids: [],
      util_count: 7,
      creado_en: daysAgo(15),
    },
    {
      usuario_id: uIds.customer3,
      restaurante_id: rIds.pizza,
      orden_id: new ObjectId(),
      calificacion: 4,
      comentario: "Muy rica la pizza 4 quesos. La entrega fue rápida.",
      fotos_ids: [],
      util_count: 2,
      creado_en: daysAgo(5),
    },
    {
      usuario_id: uIds.customer2,
      restaurante_id: rIds.chuchito,
      orden_id: new ObjectId(),
      calificacion: 5,
      comentario: "El pepián es como el de mi abuela. ¡Auténtico!",
      fotos_ids: [],
      util_count: 9,
      creado_en: daysAgo(20),
    },
    {
      usuario_id: uIds.customer3,
      restaurante_id: rIds.chuchito,
      orden_id: new ObjectId(),
      calificacion: 5,
      comentario: "Los chuchitos más ricos que he probado.",
      fotos_ids: [],
      util_count: 4,
      creado_en: daysAgo(12),
    },
  ];
}

// ── Índices ───────────────────────────────────────────────────
async function crearIndices(db) {
  console.log("📌 Creando índices...");

  await db.collection("usuarios").createIndex({ email: 1 }, { unique: true, name: "idx_usuarios_email" });
  await db.collection("usuarios").createIndex({ rol: 1, activo: 1 }, { name: "idx_usuarios_rol_activo" });
  await db.collection("usuarios").createIndex({ sucursal_asignada: 1 }, { name: "idx_usuarios_sucursal_asignada" });

  await db.collection("restaurantes").createIndex({ activo: 1 }, { name: "idx_restaurantes_activo" });
  await db.collection("restaurantes").createIndex({ activo: 1, tipo_cocina_id: 1 }, { name: "idx_restaurantes_activo_tipo_cocina" });
  await db.collection("restaurantes").createIndex({ tags: 1 }, { name: "idx_restaurantes_tags" });
  await db.collection("restaurantes").createIndex(
    { nombre: "text", descripcion: "text" },
    { weights: { nombre: 10, descripcion: 5 }, name: "idx_restaurantes_texto", default_language: "spanish" }
  );

  await db.collection("sucursales").createIndex({ ubicacion: "2dsphere" }, { name: "idx_sucursales_ubicacion" });
  await db.collection("sucursales").createIndex({ restaurante_id: 1 }, { name: "idx_sucursales_restaurante" });

  await db.collection("tipos_cocina").createIndex({ activa: 1 }, { name: "idx_tipos_cocina_activa" });

  await db.collection("categorias").createIndex({ restaurante_id: 1, activa: 1 }, { name: "idx_categorias_restaurante_activa" });

  await db.collection("menuitems").createIndex(
    { restaurante_id: 1, categoria_id: 1, disponible: 1 },
    { name: "idx_menuitems_restaurante_categoria_disponible" }
  );
  await db.collection("menuitems").createIndex({ tags: 1 }, { name: "idx_menuitems_tags" });
  await db.collection("menuitems").createIndex(
    { nombre: "text", descripcion: "text" },
    { weights: { nombre: 10, descripcion: 5 }, name: "idx_menuitems_texto", default_language: "spanish" }
  );

  await db.collection("ordenes").createIndex(
    { sucursal_id: 1, creado_en: -1, estado_actual: 1 },
    { name: "idx_ordenes_sucursal_fecha_estado" }
  );
  await db.collection("ordenes").createIndex({ usuario_id: 1, estado_actual: 1 }, { name: "idx_ordenes_usuario_estado" });
  await db.collection("ordenes").createIndex(
    { sucursal_id: 1, tipo: 1, estado_actual: 1 },
    { name: "idx_ordenes_sucursal_tipo_estado" }
  );
  await db.collection("ordenes").createIndex({ creado_en: -1 }, { name: "idx_ordenes_fecha" });
  await db.collection("ordenes").createIndex({ restaurante_id: 1, creado_en: -1 }, { name: "idx_ordenes_restaurante_fecha" });

  await db.collection("resenas").createIndex({ restaurante_id: 1, calificacion: -1 }, { name: "idx_resenas_restaurante_calificacion" });
  await db.collection("resenas").createIndex({ restaurante_id: 1, creado_en: -1 }, { name: "idx_resenas_restaurante_fecha" });
  await db.collection("resenas").createIndex({ usuario_id: 1 }, { name: "idx_resenas_usuario" });
  await db.collection("resenas").createIndex({ creado_en: -1 }, { name: "idx_resenas_fecha" });

  console.log("✅ Índices creados");
}

// ── Main ──────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    console.log(`🗄️  Conectado a: ${dbName}`);

    const colecciones = ["usuarios", "tipos_cocina", "restaurantes", "sucursales", "categorias", "menuitems", "ordenes", "resenas"];
    for (const col of colecciones) {
      await db.collection(col).deleteMany({});
    }
    console.log("🧹 Colecciones limpiadas");

    const usuarios = await buildUsuarios();
    await db.collection("usuarios").insertMany(usuarios);
    console.log(`👥 Usuarios insertados: ${usuarios.length}`);

    await db.collection("tipos_cocina").insertMany(tipos_cocina);
    console.log(`🍽️  Tipos de cocina insertados: ${tipos_cocina.length}`);

    await db.collection("restaurantes").insertMany(restaurantes);
    console.log(`🏪 Restaurantes insertados: ${restaurantes.length}`);

    await db.collection("sucursales").insertMany(sucursales);
    console.log(`📍 Sucursales insertadas: ${sucursales.length}`);

    await db.collection("categorias").insertMany(categorias);
    console.log(`📂 Categorías insertadas: ${categorias.length}`);

    await db.collection("menuitems").insertMany(menuitems);
    console.log(`🍔 Menú items insertados: ${menuitems.length}`);

    const TOTAL_ORDENES = 50_000;
    const BATCH = 1_000;
    let insertadas = 0;
    for (let i = 0; i < TOTAL_ORDENES; i += BATCH) {
      const lote = Array.from({ length: Math.min(BATCH, TOTAL_ORDENES - i) }, (_, j) => buildOrden(i + j));
      await db.collection("ordenes").insertMany(lote, { ordered: false });
      insertadas += lote.length;
      process.stdout.write(`\r📦 Órdenes insertadas: ${insertadas}/${TOTAL_ORDENES}`);
    }
    console.log();

    const resenas = buildResenas();
    await db.collection("resenas").insertMany(resenas);
    console.log(`⭐ Reseñas insertadas: ${resenas.length}`);

    for (const [rid, label] of [
      [rIds.asados, "Asados Rosales"],
      [rIds.pizza, "Pizza Napoli"],
      [rIds.chuchito, "El Chuchito Feliz"],
    ]) {
      const agg = await db.collection("resenas")
        .aggregate([{ $match: { restaurante_id: rid } }, { $group: { _id: null, avg: { $avg: "$calificacion" }, count: { $sum: 1 } } }])
        .toArray();
      if (agg.length) {
        await db.collection("restaurantes").updateOne(
          { _id: rid },
          { $set: { calificacion_promedio: dec(agg[0].avg.toFixed(1)), total_resenas: agg[0].count } }
        );
        console.log(`⭐ ${label}: ${agg[0].avg.toFixed(1)} (${agg[0].count} reseñas)`);
      }
    }

    await crearIndices(db);

    console.log("\n✅ Seed completado exitosamente");
    console.log("──────────────────────────────────────────");
    console.log("Credenciales de prueba:");
    console.log("  admin@wheneverbites.com   / Admin1234!");
    console.log("  roberto@asadosrosales.com / Owner1234!");
    console.log("  mario.worker@...          / Worker1234!");
    console.log("  pedro.rep@...             / Rep12345!");
    console.log("  carlos@email.com          / Customer1!");
    console.log("──────────────────────────────────────────");
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
