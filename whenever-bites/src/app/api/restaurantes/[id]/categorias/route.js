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

    const categorias = await db
      .collection("categorias")
      .find({ restaurante_id: restauranteId, activa: true })
      .sort({ orden_display: 1, nombre: 1 })
      .toArray();

    return NextResponse.json(
      categorias.map((categoria) => ({
        _id: String(categoria._id),
        restaurante_id: String(categoria.restaurante_id),
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        orden_display: categoria.orden_display,
        activa: categoria.activa,
        creado_en: categoria.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener las categorías" },
      { status: 500 },
    );
  }
}
