import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lngRaw = searchParams.get("lng");
    const latRaw = searchParams.get("lat");
    const restauranteId = searchParams.get("restaurante_id");

    const lng = Number.parseFloat(lngRaw);
    const lat = Number.parseFloat(latRaw);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return NextResponse.json(
        { error: "lng y lat son obligatorios" },
        { status: 400 },
      );
    }

    if (restauranteId && !ObjectId.isValid(restauranteId)) {
      return NextResponse.json(
        { error: "restaurante_id inválido" },
        { status: 400 },
      );
    }

    const db = await getDb();

    const query = { activa: true };
    if (restauranteId) {
      query.restaurante_id = new ObjectId(restauranteId);
    }

    const nearby = await db
      .collection("sucursales")
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distancia_metros",
            spherical: true,
            query,
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    if (nearby.length === 0) {
      return NextResponse.json(
        { error: "No se encontró una sucursal cercana" },
        { status: 404 },
      );
    }

    const sucursal = nearby[0];

    return NextResponse.json({
      _id: String(sucursal._id),
      restaurante_id: String(sucursal.restaurante_id),
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      ubicacion: sucursal.ubicacion,
      telefono: sucursal.telefono,
      horario: sucursal.horario,
      activa: sucursal.activa,
      distancia_metros: Math.round(sucursal.distancia_metros),
      creado_en: sucursal.creado_en,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener la sucursal cercana" },
      { status: 500 },
    );
  }
}
