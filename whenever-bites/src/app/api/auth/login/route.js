import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { signAccessToken } from "@/lib/auth";

const JWT_EXPIRES_IN = "8h";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email y password son obligatorios" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const user = await db.collection("usuarios").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const token = signAccessToken(
      {
        sub: user._id.toString(),
        email: user.email,
        rol: user.rol,
      },
      { expiresIn: JWT_EXPIRES_IN },
    );

    return NextResponse.json({
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
