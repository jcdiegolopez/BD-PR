import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getCustomerOrdersHandler = async (request, context, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado")?.trim();

    const db = await getDb();

    const filter = { usuario_id: new ObjectId(user.id) };
    if (estado) {
      filter.estado_actual = estado;
    }

    const ordenes = await db
      .collection("ordenes")
      .find(filter)
      .sort({ creado_en: -1 })
      .limit(100)
      .toArray();

    const total = await db.collection("ordenes").countDocuments(filter);

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const restMap = Object.fromEntries(
      restaurantes.map((restaurante) => [String(restaurante._id), restaurante.nombre]),
    );

    const sucursales = await db.collection("sucursales").find().toArray();
    const sucMap = Object.fromEntries(
      sucursales.map((sucursal) => [String(sucursal._id), sucursal.nombre]),
    );

    return NextResponse.json({
      total,
      ordenes: ordenes.map((orden) => ({
        _id: String(orden._id),
        restaurante_id: String(orden.restaurante_id),
        restaurante: restMap[String(orden.restaurante_id)] || "—",
        sucursal_id: String(orden.sucursal_id),
        sucursal: sucMap[String(orden.sucursal_id)] || "—",
        tipo: orden.tipo,
        items: (orden.items || []).map((item) => ({
          menuitem_id: String(item.menuitem_id),
          nombre: item.nombre,
          precio_unitario: item.precio_unitario?.toString() || "0",
          cantidad: item.cantidad,
          subtotal: item.subtotal?.toString() || "0",
          opciones_elegidas: item.opciones_elegidas || {},
        })),
        monto_total: orden.monto_total?.toString() || "0",
        estado_actual: orden.estado_actual,
        historial_estados: orden.historial_estados || [],
        direccion_entrega: orden.direccion_entrega || null,
        notas: orden.notas,
        creado_en: orden.creado_en,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener tus órdenes" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getCustomerOrdersHandler, ["customer"]);
