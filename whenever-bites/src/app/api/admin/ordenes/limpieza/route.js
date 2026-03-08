import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const ALLOWED_CLEANUP_STATES = ["completado", "entregado"];
const DEFAULT_STATES = ["completado", "entregado"];
const DEFAULT_RETENTION_DAYS = 120;

function parseCutoffDate(rawBefore) {
  if (!rawBefore) {
    const date = new Date();
    date.setDate(date.getDate() - DEFAULT_RETENTION_DAYS);
    return date;
  }

  const parsed = new Date(rawBefore);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

const cleanupOrdersHandler = async (request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const cutoffDate = parseCutoffDate(body?.before);

    if (!cutoffDate) {
      return NextResponse.json(
        { error: "before debe ser una fecha valida" },
        { status: 400 },
      );
    }

    const requestedStates = Array.isArray(body?.estados) && body.estados.length > 0
      ? body.estados
      : DEFAULT_STATES;

    const invalidStates = requestedStates.filter(
      (state) => !ALLOWED_CLEANUP_STATES.includes(state),
    );

    if (invalidStates.length > 0) {
      return NextResponse.json(
        { error: "estados contiene valores invalidos" },
        { status: 400 },
      );
    }

    const states = [...new Set(requestedStates)];
    const dryRun = body?.dryRun !== false;

    const db = await getDb();
    const orders = db.collection("ordenes");

    const perState = await Promise.all(
      states.map(async (state) => {
        const filter = { estado_actual: state, creado_en: { $lt: cutoffDate } };
        const count = await orders.countDocuments(filter);
        return { estado: state, candidatos: count, filter };
      }),
    );

    const totalCandidates = perState.reduce((acc, current) => {
      return acc + current.candidatos;
    }, 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        before: cutoffDate,
        estados: states,
        totalCandidates,
        detalle: perState.map(({ estado, candidatos }) => ({
          estado,
          candidatos,
        })),
      });
    }

    const operations = perState
      .filter((item) => item.candidatos > 0)
      .map((item) => ({
        deleteMany: {
          filter: item.filter,
        },
      }));

    if (operations.length === 0) {
      return NextResponse.json({
        dryRun: false,
        before: cutoffDate,
        estados: states,
        deletedCount: 0,
        totalCandidates,
      });
    }

    const result = await orders.bulkWrite(operations, { ordered: false });

    return NextResponse.json({
      dryRun: false,
      before: cutoffDate,
      estados: states,
      totalCandidates,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error en limpieza historica de ordenes:", error);
    return NextResponse.json(
      { error: "No se pudo ejecutar la limpieza historica" },
      { status: 500 },
    );
  }
};

export const POST = withRole(cleanupOrdersHandler, ["admin"]);
