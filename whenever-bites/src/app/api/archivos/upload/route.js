import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getGridFSBucket } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(request) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("archivo");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPEG, PNG, WebP o GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el límite de 5 MB" },
        { status: 400 },
      );
    }

    const bucket = await getGridFSBucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileId = new ObjectId();
    const uploadStream = bucket.openUploadStreamWithId(fileId, file.name, {
      contentType: file.type,
      metadata: {
        subido_por: auth.user.id,
        original_name: file.name,
        size: file.size,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.end(buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return NextResponse.json({
      id: String(fileId),
      nombre: file.name,
      tipo: file.type,
      size: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "No se pudo subir el archivo" },
      { status: 500 },
    );
  }
}
