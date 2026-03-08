import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de restaurante inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get("categoria_id");
    const search = searchParams.get("search")?.trim();
    const tags = searchParams
      .getAll("tag")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean);

    if (categoriaId && !ObjectId.isValid(categoriaId)) {
      return NextResponse.json({ error: "categoria_id inválido" }, { status: 400 });
    }

    const db = await getDb();
    const restauranteId = new ObjectId(id);

    const filter = {
      restaurante_id: restauranteId,
      disponible: true,
    };

    if (categoriaId) {
      filter.categoria_id = new ObjectId(categoriaId);
    }

    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const findOptions = {};
    let sort = { nombre: 1 };

    if (search) {
      findOptions.projection = { score: { $meta: "textScore" } };
      sort = { score: { $meta: "textScore" } };
    }

    const menuItems = await db
      .collection("menuitems")
      .find(filter, findOptions)
      .sort(sort)
      .toArray();

    const categoriaIds = [...new Set(menuItems.map((item) => String(item.categoria_id)))];

    const categorias = await db
      .collection("categorias")
      .find({ _id: { $in: categoriaIds.map((cid) => new ObjectId(cid)) } })
      .toArray();

    const categoriaMap = Object.fromEntries(
      categorias.map((categoria) => [String(categoria._id), categoria.nombre]),
    );

    return NextResponse.json(
      menuItems.map((item) => ({
        _id: String(item._id),
        restaurante_id: String(item.restaurante_id),
        categoria_id: String(item.categoria_id),
        categoria: categoriaMap[String(item.categoria_id)] || "—",
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio?.toString() || "0",
        imagen_id: item.imagen_id ? String(item.imagen_id) : null,
        tags: item.tags || [],
        opciones: item.opciones || [],
        disponible: item.disponible,
        creado_en: item.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener los platillos" },
      { status: 500 },
    );
  }
}
