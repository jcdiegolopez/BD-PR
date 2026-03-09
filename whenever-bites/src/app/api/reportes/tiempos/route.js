import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";
import {
  FINAL_ORDER_STATES,
  parseDateRangeFromRequest,
  resolveScopedRestaurants,
} from "../_helpers";

function toMinutes(ms) {
  return ms / (1000 * 60);
}

const getReportTiemposHandler = async (request, context, user) => {
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
      historial_estados: { $exists: true, $type: "array", $ne: [] },
    };

    if (range.hasDateFilter) {
      match.creado_en = range.dateFilter;
    }

    const ordenes = await db
      .collection("ordenes")
      .find(match, {
        projection: {
          restaurante_id: 1,
          sucursal_id: 1,
          historial_estados: 1,
        },
      })
      .toArray();

    const sucursales = await db
      .collection("sucursales")
      .find(
        { _id: { $in: [...new Set(ordenes.map((o) => o.sucursal_id))] } },
        { projection: { nombre: 1 } },
      )
      .toArray();

    const sucursalMap = Object.fromEntries(
      sucursales.map((sucursal) => [String(sucursal._id), sucursal.nombre]),
    );

    const bucket = new Map();

    for (const orden of ordenes) {
      const history = Array.isArray(orden.historial_estados)
        ? [...orden.historial_estados]
            .filter((h) => h?.timestamp)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        : [];

      if (history.length < 2) {
        continue;
      }

      for (let i = 0; i < history.length - 1; i += 1) {
        const current = history[i];
        const next = history[i + 1];

        const start = new Date(current.timestamp);
        const end = new Date(next.timestamp);
        const elapsedMs = end.getTime() - start.getTime();

        if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
          continue;
        }

        const key = `${String(orden.sucursal_id)}::${current.estado}`;
        const currentBucket = bucket.get(key) || {
          restaurante_id: String(orden.restaurante_id),
          sucursal_id: String(orden.sucursal_id),
          estado: current.estado,
          transiciones: 0,
          totalMinutos: 0,
        };

        currentBucket.transiciones += 1;
        currentBucket.totalMinutos += toMinutes(elapsedMs);

        bucket.set(key, currentBucket);
      }
    }

    const rows = Array.from(bucket.values())
      .map((row) => ({
        ...row,
        restaurante: scopeResult.restauranteMap[row.restaurante_id] || "—",
        sucursal: sucursalMap[row.sucursal_id] || "—",
        promedio_minutos: Number(
          (row.totalMinutos / Math.max(row.transiciones, 1)).toFixed(2),
        ),
      }))
      .sort((a, b) => b.promedio_minutos - a.promedio_minutos);

    return NextResponse.json({
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error en reporte de tiempos:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte de tiempos" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getReportTiemposHandler, ["owner", "admin"]);
