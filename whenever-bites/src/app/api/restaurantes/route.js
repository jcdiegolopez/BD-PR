import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 10;

function parsePositiveInt(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

function parseTags(searchParams) {
  return searchParams
    .getAll("tags")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const requestedLimit = parsePositiveInt(
      searchParams.get("limit"),
      DEFAULT_LIMIT,
    );
    const sortParam = searchParams.get("sort");
    const tipoCocinaId = searchParams.get("tipo_cocina_id");
    const search = searchParams.get("search")?.trim();
    const tags = parseTags(searchParams);

    if (page === null || requestedLimit === null) {
      return NextResponse.json(
        { error: "page y limit deben ser enteros positivos" },
        { status: 400 },
      );
    }

    // Si viene search, solo permitimos búsqueda por texto, sin filtros ni sort
    if (search) {
      if (sortParam || tipoCocinaId || tags.length > 0) {
        return NextResponse.json(
          { error: "search no se puede combinar con filtros ni sort" },
          { status: 400 },
        );
      }
    }

    if (sortParam && !["calificacion_promedio", "nombre"].includes(sortParam)) {
      return NextResponse.json(
        { error: "sort debe ser calificacion_promedio o nombre" },
        { status: 400 },
      );
    }

    if (tipoCocinaId && !ObjectId.isValid(tipoCocinaId)) {
      return NextResponse.json(
        { error: "tipo_cocina_id inválido" },
        { status: 400 },
      );
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const db = await getDb();

    let filter = { activo: true };
    let findOptions = {};
    let sort = { calificacion_promedio: -1 };

    if (search) {
      // Solo búsqueda por texto
      filter = { activo: true, $text: { $search: search } };
      findOptions.projection = { score: { $meta: "textScore" } };
      sort = { score: { $meta: "textScore" } };
    } else {
      // Solo filtros
      if (tipoCocinaId) {
        filter.tipo_cocina_id = new ObjectId(tipoCocinaId);
      }
      if (tags.length > 0) {
        filter.tags = { $in: tags };
      }
      if (sortParam === "nombre") {
        sort = { nombre: 1 };
      }
    }

    const total = await db.collection("restaurantes").countDocuments(filter);
    const restaurantes = await db
      .collection("restaurantes")
      .find(filter, findOptions)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const tiposCocina = await db
      .collection("tipos_cocina")
      .find({ activa: true })
      .toArray();
    const tipoMap = Object.fromEntries(
      tiposCocina.map((t) => [String(t._id), t.nombre]),
    );

    const restIds = restaurantes.map((restaurante) => restaurante._id);
    const sucursales = await db
      .collection("sucursales")
      .find({ restaurante_id: { $in: restIds }, activa: true })
      .toArray();

    const sucursalesPorRestaurante = new Map();
    for (const sucursal of sucursales) {
      const key = String(sucursal.restaurante_id);
      if (!sucursalesPorRestaurante.has(key)) {
        sucursalesPorRestaurante.set(key, []);
      }
      sucursalesPorRestaurante.get(key).push({
        _id: String(sucursal._id),
        nombre: sucursal.nombre,
        direccion: `${sucursal.direccion.calle}, ${sucursal.direccion.zona}`,
        horario: `${sucursal.horario.apertura} - ${sucursal.horario.cierre}`,
      });
    }

    const data = restaurantes.map((r) => ({
      _id: String(r._id),
      nombre: r.nombre,
      descripcion: r.descripcion,
      tipo_cocina_id: String(r.tipo_cocina_id),
      tipo_cocina: tipoMap[String(r.tipo_cocina_id)] || "—",
      tags: r.tags || [],
      calificacion_promedio: r.calificacion_promedio?.toString() || "0",
      total_resenas: r.total_resenas || 0,
      sucursales: sucursalesPorRestaurante.get(String(r._id)) || [],
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener restaurantes" },
      { status: 500 },
    );
  }
}
