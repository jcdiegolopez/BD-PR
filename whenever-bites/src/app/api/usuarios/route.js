import { NextResponse } from "next/server";

/**
 * DEPRECATED: Este endpoint ya no se usa.
 * 
 * Use en su lugar:
 * - GET /api/admin/usuarios (para listar usuarios)
 * - POST /api/admin/usuarios (para crear usuarios)
 */

export async function GET() {
  return NextResponse.json(
    { error: "Este endpoint está deprecado. Use GET /api/admin/usuarios" },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Este endpoint está deprecado. Use POST /api/admin/usuarios" },
    { status: 410 },
  );
}
