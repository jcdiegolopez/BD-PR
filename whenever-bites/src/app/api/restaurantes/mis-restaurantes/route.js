import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  const auth = getAuthUserFromRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const user = auth.user;

    let restaurantes = [];

    if (user.rol === "admin") {
      // Admin ve todos los restaurantes
      restaurantes = await db
        .collection("restaurantes")
        .find({ activo: true })
        .project({ _id: 1, nombre: 1 })
        .toArray();
    } else if (user.rol === "owner") {
      // Owner ve solo sus restaurantes
      restaurantes = await db
        .collection("restaurantes")
        .find({ propietario_id: new ObjectId(user.sub), activo: true })
        .project({ _id: 1, nombre: 1 })
        .toArray();
    } else {
      return NextResponse.json({ error: "No tiene permiso" }, { status: 403 });
    }

    return NextResponse.json({ data: restaurantes });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al cargar restaurantes" }, { status: 500 });
  }
}
