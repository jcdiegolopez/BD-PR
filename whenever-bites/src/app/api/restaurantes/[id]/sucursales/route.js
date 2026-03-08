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

    const sucursales = await db
      .collection("sucursales")
      .find({ restaurante_id: restauranteId, activa: true })
      .sort({ creado_en: -1 })
      .toArray();

    return NextResponse.json(
      sucursales.map((sucursal) => ({
        _id: String(sucursal._id),
        restaurante_id: String(sucursal.restaurante_id),
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        ubicacion: sucursal.ubicacion,
        telefono: sucursal.telefono,
        horario: sucursal.horario,
        activa: sucursal.activa,
        creado_en: sucursal.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener las sucursales" },
      { status: 500 },
    );
  }
}
