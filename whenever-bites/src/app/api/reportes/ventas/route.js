import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";
import {
  FINAL_ORDER_STATES,
  parseDateRangeFromRequest,
  resolveScopedRestaurants,
} from "../_helpers";

const getReportVentasHandler = async (request, context, user) => {
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
      estado_actual: { $in: FINAL_ORDER_STATES },
    };

    if (range.hasDateFilter) {
      match.creado_en = range.dateFilter;
    }

    const rows = await db
      .collection("ordenes")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$restaurante_id",
            total_ordenes: { $sum: 1 },
            ventas_brutas: { $sum: { $toDouble: "$monto_total" } },
          },
        },
        {
          $lookup: {
            from: "restaurantes",
            localField: "_id",
            foreignField: "_id",
            as: "restaurante_info",
          },
        },
        {
          $addFields: {
            restaurante: {
              $ifNull: [
                { $arrayElemAt: ["$restaurante_info.nombre", 0] },
                "—",
              ],
            },
            ticket_promedio: {
              $cond: [
                { $gt: ["$total_ordenes", 0] },
                { $divide: ["$ventas_brutas", "$total_ordenes"] },
                0,
              ],
            },
          },
        },
        { $project: { restaurante_info: 0 } },
        { $sort: { ventas_brutas: -1 } },
      ])
      .toArray();

    return NextResponse.json({
      total: rows.length,
      data: rows.map((row) => ({
        restaurante_id: String(row._id),
        restaurante: row.restaurante,
        total_ordenes: row.total_ordenes,
        ventas_brutas: Number(row.ventas_brutas || 0).toFixed(2),
        ticket_promedio: Number(row.ticket_promedio || 0).toFixed(2),
      })),
    });
  } catch (error) {
    console.error("Error en reporte de ventas:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte de ventas" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getReportVentasHandler, ["owner", "admin"]);
