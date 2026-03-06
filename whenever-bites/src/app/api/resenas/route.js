import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getResenasHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    const resenas = await db
      .collection("resenas")
      .find({ usuario_id: new ObjectId(user.id) })
      .sort({ creado_en: -1 })
      .toArray();

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const restMap = Object.fromEntries(
      restaurantes.map((r) => [String(r._id), r.nombre]),
    );

    return NextResponse.json(
      resenas.map((r) => ({
        _id: String(r._id),
        restaurante: restMap[String(r.restaurante_id)] || "—",
        calificacion: r.calificacion,
        comentario: r.comentario,
        util_count: r.util_count || 0,
        creado_en: r.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener reseñas" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getResenasHandler, ["customer"]);
