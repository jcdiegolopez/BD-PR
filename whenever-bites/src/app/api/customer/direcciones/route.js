import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const MAX_DIRECCIONES = 5;

const postDireccionHandler = async (request, context, user) => {
  try {
    const body = await request.json();
    const { alias, texto, ubicacion, predeterminada } = body;

    if (!alias || typeof alias !== "string" || !alias.trim()) {
      return NextResponse.json({ error: "alias es obligatorio" }, { status: 400 });
    }

    if (!texto || typeof texto !== "string" || !texto.trim()) {
      return NextResponse.json({ error: "texto es obligatorio" }, { status: 400 });
    }

    if (
      !ubicacion ||
      ubicacion.type !== "Point" ||
      !Array.isArray(ubicacion.coordinates) ||
      ubicacion.coordinates.length !== 2
    ) {
      return NextResponse.json(
        { error: "ubicacion debe ser un GeoJSON Point valido" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new ObjectId(user.id);

    const usuario = await db.collection("usuarios").findOne({ _id: userId });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const direcciones = usuario.direcciones_guardadas || [];

    if (direcciones.length >= MAX_DIRECCIONES) {
      return NextResponse.json(
        { error: `Maximo ${MAX_DIRECCIONES} direcciones permitidas` },
        { status: 400 },
      );
    }

    if (direcciones.some((d) => d.alias === alias.trim())) {
      return NextResponse.json(
        { error: "Ya existe una direccion con ese alias" },
        { status: 409 },
      );
    }

    const esPredeterminada = predeterminada === true;

    // Si la nueva es predeterminada, quitar predeterminada de las demás
    if (esPredeterminada && direcciones.length > 0) {
      await db.collection("usuarios").updateOne(
        { _id: userId },
        { $set: { "direcciones_guardadas.$[].predeterminada": false } },
      );
    }

    const nuevaDireccion = {
      alias: alias.trim(),
      texto: texto.trim(),
      ubicacion: {
        type: "Point",
        coordinates: [Number(ubicacion.coordinates[0]), Number(ubicacion.coordinates[1])],
      },
      predeterminada: esPredeterminada,
    };

    await db.collection("usuarios").updateOne(
      { _id: userId },
      { $push: { direcciones_guardadas: nuevaDireccion } },
    );

    return NextResponse.json(nuevaDireccion, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/customer/direcciones:", error);
    return NextResponse.json(
      { error: "No se pudo agregar la direccion" },
      { status: 500 },
    );
  }
};

export const POST = withRole(postDireccionHandler, ["customer"]);

const getDireccionesHandler = async (request, context, user) => {
  try {
    const db = await getDb();
    const usuario = await db.collection("usuarios").findOne(
      { _id: new ObjectId(user.id) },
      { projection: { direcciones_guardadas: 1 } },
    );

    return NextResponse.json(usuario?.direcciones_guardadas || []);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener las direcciones" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getDireccionesHandler, ["customer"]);
