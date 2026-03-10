import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getAdminRestaurantesHandler = async () => {
  try {
    const db = await getDb();

    const restaurantes = await db
      .collection("restaurantes")
      .find({})
      .sort({ creado_en: -1 })
      .toArray();

    const ownerIds = restaurantes
      .map((restaurante) => restaurante.propietario_id)
      .filter(Boolean);

    const owners = ownerIds.length
      ? await db
          .collection("usuarios")
          .find({ _id: { $in: ownerIds } })
          .project({ nombre: 1, email: 1 })
          .toArray()
      : [];

    const ownerMap = new Map(owners.map((owner) => [String(owner._id), owner]));

    const restIds = restaurantes.map((restaurante) => restaurante._id);
    const sucursales = restIds.length
      ? await db
          .collection("sucursales")
          .find({ restaurante_id: { $in: restIds } })
          .toArray()
      : [];

    const sucursalesPorRestaurante = new Map();
    for (const sucursal of sucursales) {
      const key = String(sucursal.restaurante_id);
      if (!sucursalesPorRestaurante.has(key)) {
        sucursalesPorRestaurante.set(key, []);
      }
      sucursalesPorRestaurante.get(key).push({
        _id: String(sucursal._id),
        nombre: sucursal.nombre,
        zona: sucursal.direccion?.zona || "Sin zona",
      });
    }

    return NextResponse.json(
      restaurantes.map((restaurante) => {
        const owner = ownerMap.get(String(restaurante.propietario_id));
        return {
          _id: String(restaurante._id),
          nombre: restaurante.nombre,
          descripcion: restaurante.descripcion,
          tags: restaurante.tags || [],
          calificacion_promedio: restaurante.calificacion_promedio?.toString() || "0",
          total_resenas: restaurante.total_resenas || 0,
          owner_nombre: owner?.nombre || "Sin asignar",
          owner_email: owner?.email || "-",
          sucursales: sucursalesPorRestaurante.get(String(restaurante._id)) || [],
        };
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener los restaurantes" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getAdminRestaurantesHandler, ["admin"]);
