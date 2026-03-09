import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const patchOwnerCategoryToggleHandler = async (request, context, user) => {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de categoria invalido" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const hasActiva = Object.prototype.hasOwnProperty.call(body, "activa");

    if (hasActiva && typeof body.activa !== "boolean") {
      return NextResponse.json(
        { error: "activa debe ser boolean" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const categoriaId = new ObjectId(id);

    const categoria = await db.collection("categorias").findOne({ _id: categoriaId });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria no encontrada" },
        { status: 404 },
      );
    }

    const ownedRestaurant = await db.collection("restaurantes").findOne({
      _id: categoria.restaurante_id,
      propietario_id: new ObjectId(user.id),
    });

    if (!ownedRestaurant) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const targetActiva = hasActiva ? body.activa : !Boolean(categoria.activa);

    const categoryUpdateResult = await db.collection("categorias").updateOne(
      { _id: categoriaId },
      { $set: { activa: targetActiva } },
    );

    const menuItemsUpdateResult = await db.collection("menuitems").updateMany(
      {
        restaurante_id: categoria.restaurante_id,
        categoria_id: categoriaId,
      },
      { $set: { disponible: targetActiva } },
    );

    return NextResponse.json({
      categoria_id: id,
      restaurante_id: String(categoria.restaurante_id),
      activa: targetActiva,
      categoriaMatched: categoryUpdateResult.matchedCount,
      categoriaModified: categoryUpdateResult.modifiedCount,
      menuitemsMatched: menuItemsUpdateResult.matchedCount,
      menuitemsModified: menuItemsUpdateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error en PATCH /api/owner/categorias/[id]/toggle:", error);
    return NextResponse.json(
      { error: "No se pudo cambiar el estado de la categoria" },
      { status: 500 },
    );
  }
};

export const PATCH = withRole(patchOwnerCategoryToggleHandler, ["owner"]);
