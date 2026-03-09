import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";
import {
  FINAL_ORDER_STATES,
  parseDateRangeFromRequest,
  resolveScopedRestaurants,
} from "../_helpers";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseTopLimit(request) {
  const { searchParams } = new URL(request.url);
  const topRaw = searchParams.get("top");

  if (!topRaw) return DEFAULT_LIMIT;

  const top = Number.parseInt(topRaw, 10);
  if (!Number.isFinite(top) || top < 1) {
    return null;
  }

  return Math.min(top, MAX_LIMIT);
}

const getReportPlatillosHandler = async (request, context, user) => {
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

    const top = parseTopLimit(request);
    if (!top) {
      return NextResponse.json({ error: "top invalido" }, { status: 400 });
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
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              restaurante_id: "$restaurante_id",
              menuitem_id: "$items.menuitem_id",
              nombre: "$items.nombre",
            },
            unidades_vendidas: { $sum: "$items.cantidad" },
            monto_vendido: { $sum: { $toDouble: "$items.subtotal" } },
            ordenes_participantes: { $sum: 1 },
          },
        },
        { $sort: { unidades_vendidas: -1, monto_vendido: -1 } },
        { $limit: top },
      ])
      .toArray();

    return NextResponse.json({
      total: rows.length,
      data: rows.map((row) => ({
        restaurante_id: String(row._id.restaurante_id),
        restaurante:
          scopeResult.restauranteMap[String(row._id.restaurante_id)] || "—",
        menuitem_id: String(row._id.menuitem_id),
        nombre: row._id.nombre,
        unidades_vendidas: row.unidades_vendidas,
        ordenes_participantes: row.ordenes_participantes,
        monto_vendido: Number(row.monto_vendido || 0).toFixed(2),
      })),
    });
  } catch (error) {
    console.error("Error en reporte de platillos:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte de platillos" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getReportPlatillosHandler, ["owner", "admin"]);
