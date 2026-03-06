import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const restaurantes = await db
      .collection("restaurantes")
      .find({ activo: true })
      .toArray();

    const tiposCocina = await db.collection("tipos_cocina").find().toArray();
    const tipoMap = Object.fromEntries(
      tiposCocina.map((t) => [String(t._id), t.nombre]),
    );

    const sucursales = await db
      .collection("sucursales")
      .find({ activa: true })
      .toArray();

    const data = restaurantes.map((r) => ({
      _id: String(r._id),
      nombre: r.nombre,
      descripcion: r.descripcion,
      tipo_cocina: tipoMap[String(r.tipo_cocina_id)] || "—",
      tags: r.tags || [],
      calificacion_promedio: r.calificacion_promedio?.toString() || "0",
      total_resenas: r.total_resenas || 0,
      sucursales: sucursales
        .filter((s) => String(s.restaurante_id) === String(r._id))
        .map((s) => ({
          nombre: s.nombre,
          direccion: `${s.direccion.calle}, ${s.direccion.zona}`,
          horario: `${s.horario.apertura} – ${s.horario.cierre}`,
        })),
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener restaurantes" },
      { status: 500 },
    );
  }
}
