import { NextResponse } from "next/server";
import { Decimal128, ObjectId } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const getResenasHandler = async (request, context, user) => {
  try {
    const db = await getDb();

    const resenas = await db
      .collection("resenas")
      .find({ usuario_id: new ObjectId(user.id) })
      .sort({ creado_en: -1 })
      .toArray();

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const restMap = Object.fromEntries(
      restaurantes.map((r) => [String(r._id), r.nombre]),
    );

    return NextResponse.json(
      resenas.map((r) => ({
        _id: String(r._id),
        restaurante: restMap[String(r.restaurante_id)] || "—",
        calificacion: r.calificacion,
        comentario: r.comentario,
        util_count: r.util_count || 0,
        creado_en: r.creado_en,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener reseñas" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getResenasHandler, ["customer"]);

const postResenasHandler = async (request, context, user) => {
  let session;

  try {
    const body = await request.json();
    const {
      restaurante_id: restauranteId,
      orden_id: ordenId,
      calificacion,
      comentario,
      fotos_ids: fotosIds,
    } = body;

    if (!ObjectId.isValid(restauranteId) || !ObjectId.isValid(ordenId)) {
      return NextResponse.json(
        { error: "restaurante_id y orden_id son obligatorios" },
        { status: 400 },
      );
    }

    const rating = Number.parseInt(calificacion, 10);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "calificacion debe ser un entero entre 1 y 5" },
        { status: 400 },
      );
    }

    if (!comentario || typeof comentario !== "string" || comentario.trim().length === 0) {
      return NextResponse.json(
        { error: "comentario es obligatorio" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const client = await getMongoClient();

    const restauranteObjectId = new ObjectId(restauranteId);
    const ordenObjectId = new ObjectId(ordenId);
    const usuarioObjectId = new ObjectId(user.id);

    session = client.startSession();
    let createdReview = null;

    await session.withTransaction(async () => {
      const restaurante = await db.collection("restaurantes").findOne(
        { _id: restauranteObjectId, activo: true },
        { session },
      );

      if (!restaurante) {
        throw new Error("Restaurante no encontrado o inactivo");
      }

      const orden = await db.collection("ordenes").findOne(
        {
          _id: ordenObjectId,
          usuario_id: usuarioObjectId,
          restaurante_id: restauranteObjectId,
          estado_actual: { $in: ["completado", "entregado"] },
        },
        { session },
      );

      if (!orden) {
        throw new Error("La orden no aplica para reseña");
      }

      const existing = await db.collection("resenas").findOne(
        {
          usuario_id: usuarioObjectId,
          orden_id: ordenObjectId,
        },
        { session },
      );

      if (existing) {
        throw new Error("Ya existe una reseña para esta orden");
      }

      const now = new Date();
      const reviewDoc = {
        usuario_id: usuarioObjectId,
        restaurante_id: restauranteObjectId,
        orden_id: ordenObjectId,
        calificacion: rating,
        comentario: comentario.trim(),
        fotos_ids: Array.isArray(fotosIds)
          ? fotosIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
          : [],
        util_count: 0,
        creado_en: now,
      };

      const insertResult = await db
        .collection("resenas")
        .insertOne(reviewDoc, { session });

      const reviewStats = await db
        .collection("resenas")
        .aggregate(
          [
            { $match: { restaurante_id: restauranteObjectId } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                promedio: { $avg: "$calificacion" },
              },
            },
          ],
          { session },
        )
        .toArray();

      const stats = reviewStats[0] || { total: 0, promedio: 0 };
      const average = Number(stats.promedio || 0).toFixed(1);

      await db.collection("restaurantes").updateOne(
        { _id: restauranteObjectId },
        {
          $set: {
            total_resenas: stats.total,
            calificacion_promedio: Decimal128.fromString(average),
          },
        },
        { session },
      );

      createdReview = {
        _id: String(insertResult.insertedId),
        usuario_id: user.id,
        restaurante_id: restauranteId,
        orden_id: ordenId,
        calificacion: rating,
        comentario: reviewDoc.comentario,
        fotos_ids: reviewDoc.fotos_ids.map((id) => String(id)),
        util_count: 0,
        creado_en: now,
      };
    });

    return NextResponse.json(createdReview, { status: 201 });
  } catch (error) {
    const knownErrors = new Set([
      "Restaurante no encontrado o inactivo",
      "La orden no aplica para reseña",
      "Ya existe una reseña para esta orden",
    ]);

    if (knownErrors.has(error?.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error al crear reseña:", error);
    return NextResponse.json(
      { error: "No se pudo crear la reseña" },
      { status: 500 },
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const POST = withRole(postResenasHandler, ["customer"]);
