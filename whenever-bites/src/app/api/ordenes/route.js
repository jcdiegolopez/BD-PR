import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
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

async function handleRepartidorOrders(db, user) {
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

  const activas = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: { $in: ["listo", "en_camino"] },
    })
    .sort({ creado_en: 1 })
    .toArray();

  const enPreparacion = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: { $in: ["pendiente", "preparando"] },
    })
    .sort({ creado_en: 1 })
    .limit(20)
    .toArray();

  const completadas = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: "entregado",
    })
    .sort({ creado_en: -1 })
    .limit(20)
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
      activas: activas.length,
      enPreparacion: enPreparacion.length,
      entregadasHoy,
      totalDelivery,
    },
    activas: serialize(activas),
    enPreparacion: serialize(enPreparacion),
    completadas: serialize(completadas),
  });
}

async function handleWorkerOrders(db, user) {
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

  const pendientes = await db
    .collection("ordenes")
    .find({ sucursal_id: sid, estado_actual: "pendiente" })
    .sort({ creado_en: 1 })
    .toArray();

  const preparando = await db
    .collection("ordenes")
    .find({ sucursal_id: sid, estado_actual: "preparando" })
    .sort({ creado_en: 1 })
    .toArray();

  const listos = await db
    .collection("ordenes")
    .find({ sucursal_id: sid, estado_actual: "listo" })
    .sort({ creado_en: -1 })
    .limit(20)
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
      pendientes: pendientes.length,
      preparando: preparando.length,
      completadosHoy,
      totalHoy,
    },
    pendientes: serialize(pendientes),
    preparando: serialize(preparando),
    listos: serialize(listos),
  });
}

const getOrdenesHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    if (user.rol === "customer") {
      return handleCustomerOrders(db, user);
    }

    if (user.rol === "repartidor") {
      return handleRepartidorOrders(db, user);
    }

    if (user.rol === "worker") {
      return handleWorkerOrders(db, user);
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
