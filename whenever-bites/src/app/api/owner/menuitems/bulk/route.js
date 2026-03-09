import { NextResponse } from "next/server";
import { Decimal128, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const MAX_BULK_ITEMS = 200;

function toDecimalPrice(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return null;
  }

  return Decimal128.fromString(numberValue.toFixed(2));
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  return rawOptions
    .map((opt) => {
      if (!opt || typeof opt !== "object") return null;

      const nombre = typeof opt.nombre === "string" ? opt.nombre.trim() : "";
      const valores = Array.isArray(opt.valores)
        ? opt.valores
            .map((val) => (typeof val === "string" ? val.trim() : ""))
            .filter(Boolean)
        : [];

      if (!nombre || valores.length === 0) {
        return null;
      }

      return {
        nombre,
        valores,
        requerido: Boolean(opt.requerido),
      };
    })
    .filter(Boolean);
}

const postOwnerMenuItemsBulkHandler = async (request, context, user) => {
  try {
    const body = await request.json();
    const restauranteId = body?.restaurante_id;
    const defaultCategoriaId = body?.categoria_id;
    const items = body?.items;

    if (!ObjectId.isValid(restauranteId)) {
      return NextResponse.json(
        { error: "restaurante_id invalido" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > MAX_BULK_ITEMS
    ) {
      return NextResponse.json(
        { error: "items invalidos" },
        { status: 400 },
      );
    }

    if (defaultCategoriaId && !ObjectId.isValid(defaultCategoriaId)) {
      return NextResponse.json(
        { error: "categoria_id invalido" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const restauranteObjectId = new ObjectId(restauranteId);

    const ownedRestaurant = await db.collection("restaurantes").findOne({
      _id: restauranteObjectId,
      propietario_id: new ObjectId(user.id),
    });

    if (!ownedRestaurant) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const requiredCategoryIds = new Set();
    if (defaultCategoriaId) {
      requiredCategoryIds.add(defaultCategoriaId);
    }

    for (const item of items) {
      if (item?.categoria_id) {
        requiredCategoryIds.add(item.categoria_id);
      }
    }

    const categoryIdList = Array.from(requiredCategoryIds);

    if (categoryIdList.some((id) => !ObjectId.isValid(id))) {
      return NextResponse.json(
        { error: "categoria_id invalido en items" },
        { status: 400 },
      );
    }

    const categorias = await db
      .collection("categorias")
      .find({
        _id: { $in: categoryIdList.map((id) => new ObjectId(id)) },
        restaurante_id: restauranteObjectId,
      })
      .toArray();

    if (categorias.length !== categoryIdList.length) {
      return NextResponse.json(
        { error: "Hay categorias no validas para este restaurante" },
        { status: 400 },
      );
    }

    const categoriaMap = new Set(categorias.map((c) => String(c._id)));

    const docs = [];

    for (const item of items) {
      const categoriaId = item?.categoria_id || defaultCategoriaId;

      if (!categoriaId || !categoriaMap.has(String(categoriaId))) {
        return NextResponse.json(
          { error: "Cada item debe tener una categoria valida" },
          { status: 400 },
        );
      }

      const nombre = typeof item?.nombre === "string" ? item.nombre.trim() : "";
      if (!nombre) {
        return NextResponse.json(
          { error: "nombre es obligatorio en items" },
          { status: 400 },
        );
      }

      const descripcion =
        typeof item?.descripcion === "string" ? item.descripcion.trim() : "";
      if (!descripcion) {
        return NextResponse.json(
          { error: "descripcion es obligatoria en items" },
          { status: 400 },
        );
      }

      const precio = toDecimalPrice(item?.precio);
      if (!precio) {
        return NextResponse.json(
          { error: "precio invalido en items" },
          { status: 400 },
        );
      }

      const tags = Array.isArray(item?.tags)
        ? item.tags
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter(Boolean)
        : [];

      docs.push({
        restaurante_id: restauranteObjectId,
        categoria_id: new ObjectId(categoriaId),
        nombre,
        descripcion,
        precio,
        imagen_id: ObjectId.isValid(item?.imagen_id)
          ? new ObjectId(item.imagen_id)
          : null,
        tags,
        opciones: normalizeOptions(item?.opciones),
        disponible: item?.disponible !== false,
        creado_en: new Date(),
      });
    }

    const insertResult = await db.collection("menuitems").insertMany(docs);

    return NextResponse.json(
      {
        insertedCount: insertResult.insertedCount,
        insertedIds: Object.values(insertResult.insertedIds).map((id) => String(id)),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en POST /api/owner/menuitems/bulk:", error);
    return NextResponse.json(
      { error: "No se pudieron crear los menuitems" },
      { status: 500 },
    );
  }
};

export const POST = withRole(postOwnerMenuItemsBulkHandler, ["owner"]);
