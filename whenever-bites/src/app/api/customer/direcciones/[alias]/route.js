import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const deleteDireccionHandler = async (request, context, user) => {
  try {
    const { alias } = await context.params;

    if (!alias || typeof alias !== "string") {
      return NextResponse.json({ error: "alias es obligatorio" }, { status: 400 });
    }

    const decodedAlias = decodeURIComponent(alias);

    const db = await getDb();
    const userId = new ObjectId(user.id);

    const result = await db.collection("usuarios").updateOne(
      { _id: userId },
      { $pull: { direcciones_guardadas: { alias: decodedAlias } } },
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Direccion no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ eliminada: decodedAlias });
  } catch (error) {
    console.error("Error en DELETE /api/customer/direcciones/[alias]:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la direccion" },
      { status: 500 },
    );
  }
};

export const DELETE = withRole(deleteDireccionHandler, ["customer"]);
