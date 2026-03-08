import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const tiposCocina = await db
      .collection("tipos_cocina")
      .find({ activa: true })
      .sort({ nombre: 1 })
      .toArray();

    return NextResponse.json(
      tiposCocina.map((tipo) => ({
        _id: String(tipo._id),
        nombre: tipo.nombre,
        slug: tipo.slug,
        descripcion: tipo.descripcion,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener los tipos de cocina" },
      { status: 500 },
    );
  }
}
