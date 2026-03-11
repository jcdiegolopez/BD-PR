import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const VALID_ROLES = ["admin", "owner", "worker", "repartidor", "customer"];

/**
 * GET /api/admin/usuarios
 * Query: Q03 - find({ rol, activo })
 * Índice: IDX-02
 * 
 * Parámetros de búsqueda:
 * - ?rol=admin|owner|worker|repartidor|customer (opcional)
 * - ?activo=true|false (opcional)
 */
const getAdminUsuariosHandler = async (request, context, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get("rol");
    const activo = searchParams.get("activo");

    const db = await getDb();

    // Construir filtro
    const filter = {};
    if (rol) {
      filter.rol = rol;
    }
    if (activo !== null && activo !== undefined) {
      filter.activo = activo === "true";
    }

    // Q03: find({ rol, activo })
    // Índice: IDX-02
    const usuarios = await db
      .collection("usuarios")
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ creado_en: -1 })
      .toArray();

    // Enriquecer con información de sucursal/restaurante
    const sucursales = await db.collection("sucursales").find().toArray();
    const restaurantes = await db.collection("restaurantes").find().toArray();

    const sucMap = Object.fromEntries(
      sucursales.map((s) => [String(s._id), s]),
    );
    const restMap = Object.fromEntries(
      restaurantes.map((r) => [String(r._id), r]),
    );

    const enriched = usuarios.map((u) => {
      const usuario = {
        _id: String(u._id),
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        telefono: u.telefono || null,
        activo: u.activo,
        creado_en: u.creado_en,
      };

      // Agregar información de sucursal si está asignado
      if (u.sucursal_asignada) {
        const suc = sucMap[String(u.sucursal_asignada)];
        if (suc) {
          const rest = restMap[String(suc.restaurante_id)];
          usuario.sucursal = {
            _id: String(suc._id),
            nombre: suc.nombre,
            restaurante: rest?.nombre || "—",
          };
        }
      }

      return usuario;
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error en GET /api/admin/usuarios:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener usuarios" },
      { status: 500 },
    );
  }
};

/**
 * POST /api/admin/usuarios
 * Crear nuevo usuario con cualquier rol
 * Body: { nombre, email, password, rol, telefono?, sucursal_asignada? }
 */
const postAdminUsuarioHandler = async (request) => {
  try {
    const body = await request.json();
    const { nombre, email, password, rol, telefono, sucursal_asignada: sucursalId } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "email es obligatorio" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "password debe tener al menos 6 caracteres" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(rol)) {
      return NextResponse.json({ error: "rol invalido" }, { status: 400 });
    }

    const db = await getDb();

    const existing = await db.collection("usuarios").findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "El email ya esta registrado" }, { status: 409 });
    }

    let sucursalAsignada = null;
    if (["worker", "repartidor"].includes(rol)) {
      if (!ObjectId.isValid(sucursalId)) {
        return NextResponse.json(
          { error: "sucursal_asignada es obligatoria para worker/repartidor" },
          { status: 400 },
        );
      }

      const sucursal = await db.collection("sucursales").findOne({ _id: new ObjectId(sucursalId) });
      if (!sucursal) {
        return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
      }

      sucursalAsignada = sucursal._id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const doc = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      rol,
      telefono: telefono?.trim() || null,
      sucursal_asignada: sucursalAsignada,
      foto_perfil_id: null,
      direcciones_guardadas: rol === "customer" ? [] : undefined,
      activo: true,
      creado_en: new Date(),
    };

    const result = await db.collection("usuarios").insertOne(doc);

    return NextResponse.json(
      {
        _id: String(result.insertedId),
        nombre: doc.nombre,
        email: doc.email,
        rol: doc.rol,
        activo: doc.activo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en POST /api/admin/usuarios:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
};

export const GET = withRole(getAdminUsuariosHandler, ["admin"]);
export const POST = withRole(postAdminUsuarioHandler, ["admin"]);
