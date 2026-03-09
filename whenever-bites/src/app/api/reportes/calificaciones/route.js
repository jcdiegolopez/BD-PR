import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";
import { parseDateRangeFromRequest, resolveScopedRestaurants } from "../_helpers";

const getReportCalificacionesHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    const scopeResult = await resolveScopedRestaurants(db, user, request);
    if (!scopeResult.ok) {
      return NextResponse.json(
        { error: scopeResult.error },
        { status: scopeResult.status },
      );
    }

    if (scopeResult.restauranteIds.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const range = parseDateRangeFromRequest(request);
    if (!range.ok) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const match = {
      restaurante_id: { $in: scopeResult.restauranteIds },
    };

    if (range.hasDateFilter) {
      match.creado_en = range.dateFilter;
    }

    const rows = await db
      .collection("resenas")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$restaurante_id",
            total_resenas: { $sum: 1 },
            calificacion_promedio: { $avg: "$calificacion" },
            c1: { $sum: { $cond: [{ $eq: ["$calificacion", 1] }, 1, 0] } },
            c2: { $sum: { $cond: [{ $eq: ["$calificacion", 2] }, 1, 0] } },
            c3: { $sum: { $cond: [{ $eq: ["$calificacion", 3] }, 1, 0] } },
            c4: { $sum: { $cond: [{ $eq: ["$calificacion", 4] }, 1, 0] } },
            c5: { $sum: { $cond: [{ $eq: ["$calificacion", 5] }, 1, 0] } },
          },
        },
        { $sort: { calificacion_promedio: -1, total_resenas: -1 } },
      ])
      .toArray();

    return NextResponse.json({
      total: rows.length,
      data: rows.map((row) => ({
        restaurante_id: String(row._id),
        restaurante: scopeResult.restauranteMap[String(row._id)] || "—",
        total_resenas: row.total_resenas,
        calificacion_promedio: Number(row.calificacion_promedio || 0).toFixed(2),
        distribucion: {
          "1": row.c1,
          "2": row.c2,
          "3": row.c3,
          "4": row.c4,
          "5": row.c5,
        },
      })),
    });
  } catch (error) {
    console.error("Error en reporte de calificaciones:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte de calificaciones" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getReportCalificacionesHandler, ["owner", "admin"]);
