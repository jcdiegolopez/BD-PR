import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getGridFSBucket, getDb } from "@/lib/mongodb";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const fileId = new ObjectId(id);
    const db = await getDb();

    const files = await db
      .collection("archivos.files")
      .find({ _id: fileId })
      .toArray();

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 },
      );
    }

    const fileMeta = files[0];
    const bucket = await getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(fileId);

    const chunks = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": fileMeta.contentType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    return NextResponse.json(
      { error: "No se pudo descargar el archivo" },
      { status: 500 },
    );
  }
}
