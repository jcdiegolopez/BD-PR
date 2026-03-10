import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getOwnerMenuHandler = async (request, context, user) => {
  try {
    const db = await getDb();
    const ownerId = new ObjectId(user.id);

    const restaurantes = await db
      .collection("restaurantes")
      .find({ propietario_id: ownerId, activo: true })
      .toArray();

    const restIds = restaurantes.map((r) => r._id);

    const categorias = restIds.length
      ? await db
          .collection("categorias")
          .find({ restaurante_id: { $in: restIds }, activa: true })
          .sort({ orden_display: 1 })
          .toArray()
      : [];

    const items = restIds.length
      ? await db
          .collection("menuitems")
          .find({ restaurante_id: { $in: restIds }, disponible: true })
          .toArray()
      : [];

    return NextResponse.json({
      restaurantes: restaurantes.map((r) => ({
        _id: String(r._id),
        nombre: r.nombre,
      })),
      categorias: categorias.map((c) => ({
        _id: String(c._id),
        restaurante_id: String(c.restaurante_id),
        nombre: c.nombre,
        descripcion: c.descripcion,
      })),
      items: items.map((it) => ({
        _id: String(it._id),
        restaurante_id: String(it.restaurante_id),
        categoria_id: String(it.categoria_id),
        nombre: it.nombre,
        descripcion: it.descripcion,
        precio: it.precio?.toString() || "0",
        tags: it.tags || [],
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el menu del owner" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getOwnerMenuHandler, ["owner"]);
