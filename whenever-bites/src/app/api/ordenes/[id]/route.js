import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

function serializeOrder(order, restauranteMap, sucursalMap, usuarioMap) {
  return {
    _id: String(order._id),
    restaurante_id: String(order.restaurante_id),
    restaurante: restauranteMap[String(order.restaurante_id)] || "—",
    sucursal_id: String(order.sucursal_id),
    sucursal: sucursalMap[String(order.sucursal_id)] || "—",
    usuario_id: String(order.usuario_id),
    cliente: usuarioMap[String(order.usuario_id)]?.nombre || "Cliente",
    cliente_tel: usuarioMap[String(order.usuario_id)]?.telefono || "",
    tipo: order.tipo,
    items: (order.items || []).map((item) => ({
      menuitem_id: String(item.menuitem_id),
      nombre: item.nombre,
      precio_unitario: item.precio_unitario?.toString() || "0",
      cantidad: item.cantidad,
      subtotal: item.subtotal?.toString() || "0",
      opciones_elegidas: item.opciones_elegidas || {},
    })),
    monto_total: order.monto_total?.toString() || "0",
    estado_actual: order.estado_actual,
    historial_estados: order.historial_estados || [],
    direccion_entrega: order.direccion_entrega || null,
    notas: order.notas,
    creado_en: order.creado_en,
  };
}

const getOrderDetailHandler = async (request, context, user) => {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    const db = await getDb();
    const orderId = new ObjectId(id);

    const order = await db.collection("ordenes").findOne({ _id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (user.rol === "customer" && String(order.usuario_id) !== user.id) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    if (["worker", "repartidor"].includes(user.rol)) {
      const staffUser = await db
        .collection("usuarios")
        .findOne({ _id: new ObjectId(user.id) });

      if (!staffUser?.sucursal_asignada) {
        return NextResponse.json({ error: "Sin sucursal asignada" }, { status: 400 });
      }

      if (String(staffUser.sucursal_asignada) !== String(order.sucursal_id)) {
        return NextResponse.json({ error: "Prohibido" }, { status: 403 });
      }
    }

    if (user.rol === "owner") {
      const ownRestaurant = await db.collection("restaurantes").findOne({
        _id: order.restaurante_id,
        propietario_id: new ObjectId(user.id),
      });

      if (!ownRestaurant) {
        return NextResponse.json({ error: "Prohibido" }, { status: 403 });
      }
    }

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const restauranteMap = Object.fromEntries(
      restaurantes.map((restaurante) => [String(restaurante._id), restaurante.nombre]),
    );

    const sucursales = await db.collection("sucursales").find().toArray();
    const sucursalMap = Object.fromEntries(
      sucursales.map((sucursal) => [String(sucursal._id), sucursal.nombre]),
    );

    const usuarios = await db
      .collection("usuarios")
      .find({}, { projection: { nombre: 1, telefono: 1 } })
      .toArray();
    const usuarioMap = Object.fromEntries(
      usuarios.map((dbUser) => [
        String(dbUser._id),
        { nombre: dbUser.nombre, telefono: dbUser.telefono },
      ]),
    );

    return NextResponse.json(
      serializeOrder(order, restauranteMap, sucursalMap, usuarioMap),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el detalle de la orden" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getOrderDetailHandler, [
  "customer",
  "worker",
  "repartidor",
  "owner",
  "admin",
]);
