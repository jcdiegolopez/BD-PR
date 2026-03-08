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

    const restaurante = await db
      .collection("restaurantes")
      .findOne({ _id: restauranteId, activo: true });

    if (!restaurante) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 },
      );
    }

    const tipoCocina = await db
      .collection("tipos_cocina")
      .findOne({ _id: restaurante.tipo_cocina_id });

    return NextResponse.json({
      _id: String(restaurante._id),
      nombre: restaurante.nombre,
      descripcion: restaurante.descripcion,
      tipo_cocina_id: String(restaurante.tipo_cocina_id),
      tipo_cocina: tipoCocina?.nombre || "—",
      imagen_portada_id: restaurante.imagen_portada_id
        ? String(restaurante.imagen_portada_id)
        : null,
      propietario_id: String(restaurante.propietario_id),
      sitio_web: restaurante.sitio_web || null,
      tags: restaurante.tags || [],
      calificacion_promedio: restaurante.calificacion_promedio?.toString() || "0",
      total_resenas: restaurante.total_resenas || 0,
      creado_en: restaurante.creado_en,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el detalle del restaurante" },
      { status: 500 },
    );
  }
}
