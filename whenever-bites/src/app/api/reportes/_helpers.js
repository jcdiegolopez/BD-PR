import { ObjectId } from "mongodb";

export const FINAL_ORDER_STATES = ["completado", "entregado"];

export function parseDateRangeFromRequest(request) {
  const { searchParams } = new URL(request.url);
  const desdeRaw = searchParams.get("desde");
  const hastaRaw = searchParams.get("hasta");

  const desde = desdeRaw ? new Date(desdeRaw) : null;
  const hasta = hastaRaw ? new Date(hastaRaw) : null;

  if (desde && Number.isNaN(desde.getTime())) {
    return { ok: false, error: "desde invalido" };
  }

  if (hasta && Number.isNaN(hasta.getTime())) {
    return { ok: false, error: "hasta invalido" };
  }

  if (desde && hasta && desde > hasta) {
    return { ok: false, error: "desde debe ser menor o igual a hasta" };
  }

  const dateFilter = {};

  if (desde) {
    dateFilter.$gte = desde;
  }

  if (hasta) {
    // Include the whole day when user sends YYYY-MM-DD.
    const inclusiveEnd = new Date(hasta);
    inclusiveEnd.setHours(23, 59, 59, 999);
    dateFilter.$lte = inclusiveEnd;
  }

  return {
    ok: true,
    desde,
    hasta,
    dateFilter,
    hasDateFilter: Object.keys(dateFilter).length > 0,
  };
}

export async function resolveScopedRestaurants(db, user, request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get("restaurante_id");

  if (restauranteId && !ObjectId.isValid(restauranteId)) {
    return { ok: false, status: 400, error: "restaurante_id invalido" };
  }

  // Para owner, filtrar solo sus restaurantes
  const ownerFilter = user.rol === "owner"
    ? { propietario_id: new ObjectId(user.id) }
    : {};

  // Si se especifica un restaurante en la solicitud, validar que existe
  const requestedIdFilter = restauranteId
    ? { _id: new ObjectId(restauranteId) }
    : {};

  const query = { ...ownerFilter, ...requestedIdFilter };

  const restaurantes = await db
    .collection("restaurantes")
    .find(query)
    .project({ nombre: 1 })
    .toArray();

  if (restaurantes.length === 0) {
    return {
      ok: true,
      restauranteIds: [],
      restauranteMap: {},
    };
  }

  return {
    ok: true,
    restauranteIds: restaurantes.map((restaurante) => restaurante._id),
    restauranteMap: Object.fromEntries(
      restaurantes.map((restaurante) => [String(restaurante._id), restaurante.nombre]),
    ),
  };
}
