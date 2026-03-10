import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getOwnerSucursalesHandler = async (request, context, user) => {
  try {
    const db = await getDb();
    const ownerId = new ObjectId(user.id);

    const restaurantes = await db
      .collection("restaurantes")
      .find({ propietario_id: ownerId, activo: true })
      .toArray();

    const restIds = restaurantes.map((r) => r._id);
    const restMap = Object.fromEntries(
      restaurantes.map((r) => [String(r._id), r.nombre]),
    );

    const sucursales = restIds.length
      ? await db
          .collection("sucursales")
          .find({ restaurante_id: { $in: restIds }, activa: true })
          .toArray()
      : [];

    return NextResponse.json(
      sucursales.map((s) => ({
        _id: String(s._id),
        restaurante_id: String(s.restaurante_id),
        restaurante_nombre: restMap[String(s.restaurante_id)] || "—",
        nombre: s.nombre,
        direccion: s.direccion,
        telefono: s.telefono,
        horario: s.horario,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener las sucursales del owner" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getOwnerSucursalesHandler, ["owner"]);
