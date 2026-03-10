import { NextResponse } from "next/server";
import { Decimal128, ObjectId } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

async function handleCustomerOrders(db, user) {
  const ordenes = await db
    .collection("ordenes")
    .find({ usuario_id: new ObjectId(user.id) })
    .sort({ creado_en: -1 })
    .limit(50)
    .toArray();

  const totalOrdenes = await db
    .collection("ordenes")
    .countDocuments({ usuario_id: new ObjectId(user.id) });

  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  const sucursales = await db.collection("sucursales").find().toArray();
  const sucMap = Object.fromEntries(
    sucursales.map((s) => [String(s._id), s.nombre]),
  );

  return NextResponse.json({
    total: totalOrdenes,
    ordenes: ordenes.map((o) => ({
      _id: String(o._id),
      restaurante: restMap[String(o.restaurante_id)] || "—",
      sucursal: sucMap[String(o.sucursal_id)] || "—",
      tipo: o.tipo,
      items: o.items.map((it) => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        subtotal: it.subtotal?.toString() || "0",
      })),
      monto_total: o.monto_total?.toString() || "0",
      estado_actual: o.estado_actual,
      notas: o.notas,
      creado_en: o.creado_en,
    })),
  });
}

async function handleRepartidorOrders(db, user, request) {
  const repartidor = await db
    .collection("usuarios")
    .findOne({ _id: new ObjectId(user.id) });

  if (!repartidor?.sucursal_asignada) {
    return NextResponse.json(
      { error: "Sin sucursal asignada" },
      { status: 400 },
    );
  }

  const sid = repartidor.sucursal_asignada;

  // Paginación y filtro
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit")) || 20));
  const estado = url.searchParams.get("estado"); // opcional: listo, en_camino

  const skip = (page - 1) * limit;

  // Órdenes delivery activas de la sucursal
  const query = {
    sucursal_id: sid,
    tipo: "delivery",
    estado_actual: { $in: ["listo", "en_camino"] },
  };

  if (estado && ["listo", "en_camino"].includes(estado)) {
    query.estado_actual = estado;
  }

  const total = await db.collection("ordenes").countDocuments(query);

  const ordenes = await db
    .collection("ordenes")
    .find(query)
    .sort({ creado_en: -1 }) // quemado
    .skip(skip)
    .limit(limit)
    .toArray();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const entregadasHoy = await db
    .collection("ordenes")
    .countDocuments({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: "entregado",
      creado_en: { $gte: hoy },
    });

  const totalDelivery = await db
    .collection("ordenes")
    .countDocuments({ sucursal_id: sid, tipo: "delivery" });

  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  const sucursales = await db.collection("sucursales").find().toArray();
  const sucMap = Object.fromEntries(
    sucursales.map((s) => [String(s._id), s.nombre]),
  );

  const usuarios = await db
    .collection("usuarios")
    .find({ rol: "customer" })
    .toArray();
  const userMap = Object.fromEntries(
    usuarios.map((u) => [
      String(u._id),
      { nombre: u.nombre, telefono: u.telefono },
    ]),
  );

  const serialize = (ordenes) =>
    ordenes.map((o) => ({
      _id: String(o._id),
      restaurante: restMap[String(o.restaurante_id)] || "—",
      sucursal: sucMap[String(o.sucursal_id)] || "—",
      cliente: userMap[String(o.usuario_id)]?.nombre || "Cliente",
      cliente_tel: userMap[String(o.usuario_id)]?.telefono || "",
      items: o.items.map((it) => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        subtotal: it.subtotal?.toString() || "0",
      })),
      monto_total: o.monto_total?.toString() || "0",
      estado_actual: o.estado_actual,
      direccion_entrega: o.direccion_entrega?.texto || "—",
      notas: o.notas,
      creado_en: o.creado_en,
    }));

  const sucursal = sucursales.find((s) => String(s._id) === String(sid));
  const restName = sucursal
    ? restMap[String(sucursal.restaurante_id)] || "—"
    : "—";
  const sucName = sucursal ? sucursal.nombre : "—";

  return NextResponse.json({
    sucursalLabel: `${restName} — ${sucName}`,
    stats: {
      totalActivas: total,
      entregadasHoy,
      totalDelivery,
    },
    ordenes: serialize(ordenes),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

async function handleWorkerOrders(db, user, request) {
  const worker = await db
    .collection("usuarios")
    .findOne({ _id: new ObjectId(user.id) });

  if (!worker?.sucursal_asignada) {
    return NextResponse.json(
      { error: "Sin sucursal asignada" },
      { status: 400 },
    );
  }

  const sid = worker.sucursal_asignada;

  // Paginación y filtro
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit")) || 20));
  const estado = url.searchParams.get("estado"); // opcional: pendiente, preparando, listo

  const skip = (page - 1) * limit;

  // Órdenes activas de la sucursal
  const query = {
    sucursal_id: sid,
    estado_actual: { $in: ["pendiente", "preparando", "listo"] },
  };

  if (estado && ["pendiente", "preparando", "listo"].includes(estado)) {
    query.estado_actual = estado;
  }

  const total = await db.collection("ordenes").countDocuments(query);

  const ordenes = await db
    .collection("ordenes")
    .find(query)
    .sort({ creado_en: -1 }) // quemado
    .skip(skip)
    .limit(limit)
    .toArray();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const completadosHoy = await db
    .collection("ordenes")
    .countDocuments({
      sucursal_id: sid,
      estado_actual: { $in: ["completado", "entregado"] },
      creado_en: { $gte: hoy },
    });

  const totalHoy = await db
    .collection("ordenes")
    .countDocuments({ sucursal_id: sid, creado_en: { $gte: hoy } });

  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  const sucursales = await db.collection("sucursales").find().toArray();
  const sucMap = Object.fromEntries(
    sucursales.map((s) => [String(s._id), s.nombre]),
  );

  const usuarios = await db
    .collection("usuarios")
    .find({ rol: "customer" })
    .toArray();
  const userMap = Object.fromEntries(
    usuarios.map((u) => [
      String(u._id),
      { nombre: u.nombre, telefono: u.telefono },
    ]),
  );

  const serialize = (ordenes) =>
    ordenes.map((o) => ({
      _id: String(o._id),
      restaurante: restMap[String(o.restaurante_id)] || "—",
      sucursal: sucMap[String(o.sucursal_id)] || "—",
      cliente: userMap[String(o.usuario_id)]?.nombre || "Cliente",
      cliente_tel: userMap[String(o.usuario_id)]?.telefono || "",
      tipo: o.tipo,
      items: o.items.map((it) => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        subtotal: it.subtotal?.toString() || "0",
      })),
      monto_total: o.monto_total?.toString() || "0",
      estado_actual: o.estado_actual,
      direccion_entrega: o.direccion_entrega?.texto || null,
      notas: o.notas,
      creado_en: o.creado_en,
    }));

  const sucursal = sucursales.find((s) => String(s._id) === String(sid));
  const restName = sucursal
    ? restMap[String(sucursal.restaurante_id)] || "—"
    : "—";
  const sucName = sucursal ? sucursal.nombre : "—";

  return NextResponse.json({
    sucursalLabel: `${restName} — ${sucName}`,
    stats: {
      totalActivas: total,
      completadosHoy,
      totalHoy,
    },
    ordenes: serialize(ordenes),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

const getOrdenesHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    if (user.rol === "customer") {
      return handleCustomerOrders(db, user);
    }

    if (user.rol === "repartidor") {
      return handleRepartidorOrders(db, user, request);
    }

    if (user.rol === "worker") {
      return handleWorkerOrders(db, user, request);
    }

    return NextResponse.json({ error: "Rol no soportado" }, { status: 403 });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener órdenes" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getOrdenesHandler, ["customer", "repartidor", "worker"]);

const MAX_ITEMS_PER_ORDER = 50;

function toDecimalString(value) {
  if (!value) return "0";
  return value.toString();
}

const postOrdenesHandler = async (request, context, user) => {
  let session;

  try {
    const body = await request.json();
    const {
      restaurante_id: restauranteId,
      sucursal_id: sucursalId,
      tipo,
      items,
      direccion_entrega: direccionEntrega,
      notas,
    } = body;

    if (!ObjectId.isValid(restauranteId) || !ObjectId.isValid(sucursalId)) {
      return NextResponse.json(
        { error: "restaurante_id y sucursal_id son obligatorios" },
        { status: 400 },
      );
    }

    if (!["pickup", "delivery"].includes(tipo)) {
      return NextResponse.json(
        { error: "tipo debe ser pickup o delivery" },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json(
        { error: "items inválidos" },
        { status: 400 },
      );
    }

    if (tipo === "delivery") {
      const hasLocation =
        direccionEntrega?.ubicacion?.type === "Point" &&
        Array.isArray(direccionEntrega?.ubicacion?.coordinates) &&
        direccionEntrega.ubicacion.coordinates.length === 2;

      if (!direccionEntrega?.texto || !hasLocation) {
        return NextResponse.json(
          { error: "direccion_entrega es obligatoria para delivery" },
          { status: 400 },
        );
      }
    }

    const parsedItems = [];
    for (const item of items) {
      if (!ObjectId.isValid(item?.menuitem_id)) {
        return NextResponse.json(
          { error: "menuitem_id inválido en items" },
          { status: 400 },
        );
      }

      const cantidad = Number.parseInt(item?.cantidad, 10);
      if (Number.isNaN(cantidad) || cantidad < 1) {
        return NextResponse.json(
          { error: "cantidad inválida en items" },
          { status: 400 },
        );
      }

      parsedItems.push({
        menuitem_id: new ObjectId(item.menuitem_id),
        cantidad,
        opciones_elegidas: item.opciones_elegidas || {},
      });
    }

    const db = await getDb();
    const client = await getMongoClient();

    const restauranteObjectId = new ObjectId(restauranteId);
    const sucursalObjectId = new ObjectId(sucursalId);

    const restaurante = await db
      .collection("restaurantes")
      .findOne({ _id: restauranteObjectId, activo: true });

    if (!restaurante) {
      return NextResponse.json(
        { error: "Restaurante no encontrado o inactivo" },
        { status: 404 },
      );
    }

    const sucursal = await db.collection("sucursales").findOne({
      _id: sucursalObjectId,
      restaurante_id: restauranteObjectId,
      activa: true,
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada para el restaurante" },
        { status: 404 },
      );
    }

    session = client.startSession();
    let createdOrder = null;

    await session.withTransaction(async () => {
      const uniqueMenuItemIds = [
        ...new Set(parsedItems.map((item) => String(item.menuitem_id))),
      ].map((id) => new ObjectId(id));

      const menuItems = await db
        .collection("menuitems")
        .find(
          {
            _id: { $in: uniqueMenuItemIds },
            restaurante_id: restauranteObjectId,
            disponible: true,
          },
          { session },
        )
        .toArray();

      if (menuItems.length !== uniqueMenuItemIds.length) {
        throw new Error("Hay items no disponibles o inválidos");
      }

      const menuMap = Object.fromEntries(
        menuItems.map((item) => [String(item._id), item]),
      );

      let total = 0;
      const snapshotItems = parsedItems.map((item) => {
        const dbItem = menuMap[String(item.menuitem_id)];
        const precioUnitario = Number.parseFloat(toDecimalString(dbItem.precio));
        const subtotalNumber = Number((precioUnitario * item.cantidad).toFixed(2));
        total += subtotalNumber;

        return {
          menuitem_id: dbItem._id,
          nombre: dbItem.nombre,
          precio_unitario: dbItem.precio,
          cantidad: item.cantidad,
          subtotal: Decimal128.fromString(subtotalNumber.toFixed(2)),
          opciones_elegidas: item.opciones_elegidas,
        };
      });

      const now = new Date();
      const ordenDoc = {
        restaurante_id: restauranteObjectId,
        sucursal_id: sucursalObjectId,
        usuario_id: new ObjectId(user.id),
        tipo,
        items: snapshotItems,
        monto_total: Decimal128.fromString(total.toFixed(2)),
        estado_actual: "pendiente",
        historial_estados: [
          { estado: "pendiente", timestamp: now, cambiado_por: null },
        ],
        direccion_entrega: tipo === "delivery" ? direccionEntrega : null,
        notas: notas || null,
        creado_en: now,
      };

      const insertResult = await db
        .collection("ordenes")
        .insertOne(ordenDoc, { session });

      createdOrder = {
        _id: String(insertResult.insertedId),
        restaurante_id: restauranteId,
        sucursal_id: sucursalId,
        usuario_id: user.id,
        tipo,
        items: snapshotItems.map((item) => ({
          menuitem_id: String(item.menuitem_id),
          nombre: item.nombre,
          precio_unitario: toDecimalString(item.precio_unitario),
          cantidad: item.cantidad,
          subtotal: toDecimalString(item.subtotal),
          opciones_elegidas: item.opciones_elegidas,
        })),
        monto_total: total.toFixed(2),
        estado_actual: "pendiente",
        direccion_entrega: ordenDoc.direccion_entrega,
        notas: ordenDoc.notas,
        creado_en: now,
      };
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    if (error?.message === "Hay items no disponibles o inválidos") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { error: "No se pudo crear la orden" },
      { status: 500 },
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const POST = withRole(postOrdenesHandler, ["customer"]);
