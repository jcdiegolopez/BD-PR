import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de restaurante inválido" }, { status: 400 });
    }

    const db = await getDb();
    const restauranteId = new ObjectId(id);

    const resenas = await db
      .collection("resenas")
      .find({ restaurante_id: restauranteId })
      .sort({ calificacion: -1, creado_en: -1 })
      .toArray();

    const usuarioIds = [...new Set(resenas.map((resena) => String(resena.usuario_id)))];

    const usuarios = await db
      .collection("usuarios")
      .find(
        { _id: { $in: usuarioIds.map((uid) => new ObjectId(uid)) } },
        { projection: { nombre: 1 } },
      )
      .toArray();

    const usuarioMap = Object.fromEntries(
      usuarios.map((usuario) => [String(usuario._id), usuario.nombre]),
    );

    return NextResponse.json(
      resenas.map((resena) => ({
        _id: String(resena._id),
        usuario_id: String(resena.usuario_id),
        usuario: usuarioMap[String(resena.usuario_id)] || "Cliente",
        restaurante_id: String(resena.restaurante_id),
        orden_id: String(resena.orden_id),
        calificacion: resena.calificacion,
        comentario: resena.comentario,
        fotos_ids: (resena.fotos_ids || []).map((fotoId) => String(fotoId)),
        util_count: resena.util_count || 0,
        creado_en: resena.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener las reseñas" },
      { status: 500 },
    );
  }
}
