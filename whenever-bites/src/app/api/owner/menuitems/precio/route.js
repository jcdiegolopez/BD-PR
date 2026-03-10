import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const patchPrecioHandler = async (request, context, user) => {
  try {
    const body = await request.json();
    const { restaurante_id: restauranteId, categoria_id: categoriaId, tipo, porcentaje } = body;

    if (!ObjectId.isValid(restauranteId)) {
      return NextResponse.json(
        { error: "restaurante_id invalido" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(categoriaId)) {
      return NextResponse.json(
        { error: "categoria_id invalido" },
        { status: 400 },
      );
    }

    if (!["aumento", "oferta"].includes(tipo)) {
      return NextResponse.json(
        { error: "tipo debe ser 'aumento' o 'oferta'" },
        { status: 400 },
      );
    }

    const pct = Number(porcentaje);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return NextResponse.json(
        { error: "porcentaje debe ser un numero entre 0 y 100 (exclusivo)" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const restauranteObjectId = new ObjectId(restauranteId);
    const categoriaObjectId = new ObjectId(categoriaId);

    const ownedRestaurant = await db.collection("restaurantes").findOne({
      _id: restauranteObjectId,
      propietario_id: new ObjectId(user.id),
    });

    if (!ownedRestaurant) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const categoria = await db.collection("categorias").findOne({
      _id: categoriaObjectId,
      restaurante_id: restauranteObjectId,
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria no encontrada para este restaurante" },
        { status: 404 },
      );
    }

    // aumento: multiplicar por (1 + porcentaje/100)
    // oferta:  multiplicar por (1 - porcentaje/100)
    const factor = tipo === "aumento"
      ? 1 + pct / 100
      : 1 - pct / 100;

    const result = await db.collection("menuitems").updateMany(
      {
        restaurante_id: restauranteObjectId,
        categoria_id: categoriaObjectId,
      },
      { $mul: { precio: factor } },
    );

    return NextResponse.json({
      restaurante_id: restauranteId,
      categoria_id: categoriaId,
      tipo,
      porcentaje: pct,
      factor,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error en PATCH /api/owner/menuitems/precio:", error);
    return NextResponse.json(
      { error: "No se pudo ajustar el precio" },
      { status: 500 },
    );
  }
};

export const PATCH = withRole(patchPrecioHandler, ["owner"]);
