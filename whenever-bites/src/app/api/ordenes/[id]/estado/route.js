import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const VALID_STATES = [
  "pendiente",
  "preparando",
  "listo",
  "completado",
  "en_camino",
  "entregado",
];

const WORKER_TRANSITIONS = {
  pickup: {
    pendiente: "preparando",
    preparando: "listo",
    listo: "completado",
  },
  delivery: {
    pendiente: "preparando",
    preparando: "listo",
  },
};

const REPARTIDOR_TRANSITIONS = {
  delivery: {
    listo: "en_camino",
    en_camino: "entregado",
  },
};

function getExpectedNextState(userRole, orderType, currentState) {
  if (userRole === "worker") {
    return WORKER_TRANSITIONS[orderType]?.[currentState] || null;
  }

  if (userRole === "repartidor") {
    return REPARTIDOR_TRANSITIONS[orderType]?.[currentState] || null;
  }

  return null;
}

const patchOrderStatusHandler = async (request, context, user) => {
  let session;

  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de orden invalido" }, { status: 400 });
    }

    const body = await request.json();
    const nuevoEstado = body?.estado;

    if (!VALID_STATES.includes(nuevoEstado)) {
      return NextResponse.json(
        { error: "estado invalido" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const client = await getMongoClient();

    const staffUser = await db
      .collection("usuarios")
      .findOne({ _id: new ObjectId(user.id) });

    if (!staffUser?.sucursal_asignada) {
      return NextResponse.json(
        { error: "Sin sucursal asignada" },
        { status: 400 },
      );
    }

    const orderId = new ObjectId(id);
    const staffSucursalId = String(staffUser.sucursal_asignada);

    session = client.startSession();

    let updatedOrder = null;
    let httpError = null;

    await session.withTransaction(async () => {
      const order = await db
        .collection("ordenes")
        .findOne({ _id: orderId }, { session });

      if (!order) {
        httpError = { status: 404, error: "Orden no encontrada" };
        return;
      }

      if (String(order.sucursal_id) !== staffSucursalId) {
        httpError = { status: 403, error: "Prohibido" };
        return;
      }

      const expectedNextState = getExpectedNextState(
        user.rol,
        order.tipo,
        order.estado_actual,
      );

      if (!expectedNextState || expectedNextState !== nuevoEstado) {
        httpError = {
          status: 409,
          error: "Transicion de estado invalida para este rol",
          current: order.estado_actual,
          expected: expectedNextState,
        };
        return;
      }

      const now = new Date();
      const statusHistoryEntry = {
        estado: nuevoEstado,
        timestamp: now,
        cambiado_por: new ObjectId(user.id),
      };

      const updateResult = await db.collection("ordenes").updateOne(
        { _id: orderId, estado_actual: order.estado_actual },
        {
          $set: { estado_actual: nuevoEstado },
          $push: { historial_estados: statusHistoryEntry },
        },
        { session },
      );

      if (updateResult.modifiedCount !== 1) {
        httpError = {
          status: 409,
          error: "La orden cambio de estado, intenta de nuevo",
        };
        return;
      }

      updatedOrder = {
        _id: String(orderId),
        tipo: order.tipo,
        estado_anterior: order.estado_actual,
        estado_actual: nuevoEstado,
        cambiado_en: now,
      };
    });

    if (httpError) {
      return NextResponse.json(httpError, { status: httpError.status });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error al cambiar estado de orden:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el estado de la orden" },
      { status: 500 },
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const PATCH = withRole(patchOrderStatusHandler, ["worker", "repartidor"]);
