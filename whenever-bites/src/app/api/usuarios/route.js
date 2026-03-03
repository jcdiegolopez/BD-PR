import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getUsersHandler = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get("rol");
    const activo = searchParams.get("activo");
    const sucursalId = searchParams.get("sucursal_asignada");

    const filter = {};
    if (rol) filter.rol = rol;
    if (activo !== null) filter.activo = activo === "true";
    if (sucursalId) filter.sucursal_asignada = new ObjectId(sucursalId);

    const db = await getDb();
    const data = await db.collection("usuarios").find(filter).toArray();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener usuarios" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getUsersHandler, ["admin"]);
