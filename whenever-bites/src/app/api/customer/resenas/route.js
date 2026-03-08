import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getCustomerReviewsHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    const resenas = await db
      .collection("resenas")
      .find({ usuario_id: new ObjectId(user.id) })
      .sort({ creado_en: -1 })
      .toArray();

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const restMap = Object.fromEntries(
      restaurantes.map((restaurante) => [String(restaurante._id), restaurante.nombre]),
    );

    return NextResponse.json({
      total: resenas.length,
      data: resenas.map((resena) => ({
        _id: String(resena._id),
        usuario_id: String(resena.usuario_id),
        restaurante_id: String(resena.restaurante_id),
        restaurante: restMap[String(resena.restaurante_id)] || "—",
        orden_id: String(resena.orden_id),
        calificacion: resena.calificacion,
        comentario: resena.comentario,
        fotos_ids: (resena.fotos_ids || []).map((fotoId) => String(fotoId)),
        util_count: resena.util_count || 0,
        creado_en: resena.creado_en,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener tus reseñas" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getCustomerReviewsHandler, ["customer"]);
