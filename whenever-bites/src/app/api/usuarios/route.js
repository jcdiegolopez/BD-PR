import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

const VALID_ROLES = ["admin", "owner", "worker", "repartidor", "customer"];

const getUsersHandler = async (request, context, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get("rol");
    const activo = searchParams.get("activo");
    const sucursalId = searchParams.get("sucursal_asignada");

    const db = await getDb();

    const filter = {};
    if (rol) filter.rol = rol;
    if (activo !== null && activo !== undefined) filter.activo = activo === "true";
    if (sucursalId) filter.sucursal_asignada = new ObjectId(sucursalId);

    const usuarios = await db
      .collection("usuarios")
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ creado_en: -1 })
      .toArray();

    const restaurantes = await db.collection("restaurantes").find().toArray();
    const sucursales = await db.collection("sucursales").find().toArray();

    const restMap = Object.fromEntries(
      restaurantes.map((r) => [String(r._id), r]),
    );
    const sucMap = Object.fromEntries(
      sucursales.map((s) => [String(s._id), s]),
    );

    const enriched = await Promise.all(
      usuarios.map(async (u) => {
        const uid = u._id;
        let detalle = {};

        if (u.rol === "customer") {
          const ordenes = await db
            .collection("ordenes")
            .find({ usuario_id: uid })
            .sort({ creado_en: -1 })
            .limit(5)
            .toArray();

          const totalOrdenes = await db
            .collection("ordenes")
            .countDocuments({ usuario_id: uid });

          const resenas = await db
            .collection("resenas")
            .find({ usuario_id: uid })
            .sort({ creado_en: -1 })
            .toArray();

          detalle = {
            ordenes: {
              total: totalOrdenes,
              recientes: ordenes.map((o) => ({
                _id: String(o._id),
                restaurante:
                  restMap[String(o.restaurante_id)]?.nombre || "—",
                tipo: o.tipo,
                monto_total: o.monto_total?.toString() || "0",
                estado_actual: o.estado_actual,
                creado_en: o.creado_en,
              })),
            },
            resenas: {
              total: resenas.length,
              lista: resenas.map((r) => ({
                _id: String(r._id),
                restaurante:
                  restMap[String(r.restaurante_id)]?.nombre || "—",
                calificacion: r.calificacion,
                comentario: r.comentario,
                creado_en: r.creado_en,
              })),
            },
          };
        }

        if (u.rol === "owner") {
          const misRests = restaurantes.filter(
            (r) => String(r.propietario_id) === String(uid),
          );

          detalle = {
            restaurantes: await Promise.all(
              misRests.map(async (r) => {
                const restSucs = sucursales.filter(
                  (s) => String(s.restaurante_id) === String(r._id),
                );
                const totalOrdenes = await db
                  .collection("ordenes")
                  .countDocuments({ restaurante_id: r._id });

                return {
                  _id: String(r._id),
                  nombre: r.nombre,
                  descripcion: r.descripcion,
                  calificacion_promedio:
                    r.calificacion_promedio?.toString() || "0",
                  total_resenas: r.total_resenas || 0,
                  total_ordenes: totalOrdenes,
                  sucursales: restSucs.map((s) => ({
                    _id: String(s._id),
                    nombre: s.nombre,
                    direccion: `${s.direccion.calle}, ${s.direccion.zona}`,
                  })),
                };
              }),
            ),
          };
        }

        if (u.rol === "worker") {
          const suc = u.sucursal_asignada
            ? sucMap[String(u.sucursal_asignada)]
            : null;
          const rest = suc ? restMap[String(suc.restaurante_id)] : null;
          const ordenesCount = suc
            ? await db
                .collection("ordenes")
                .countDocuments({ sucursal_id: suc._id })
            : 0;

          detalle = {
            sucursal: suc
              ? {
                  nombre: suc.nombre,
                  restaurante: rest?.nombre || "—",
                  direccion: `${suc.direccion.calle}, ${suc.direccion.zona}`,
                  horario: `${suc.horario.apertura} – ${suc.horario.cierre}`,
                }
              : null,
            ordenes_atendidas: ordenesCount,
          };
        }

        if (u.rol === "repartidor") {
          const suc = u.sucursal_asignada
            ? sucMap[String(u.sucursal_asignada)]
            : null;
          const rest = suc ? restMap[String(suc.restaurante_id)] : null;
          const entregasCount = suc
            ? await db
                .collection("ordenes")
                .countDocuments({
                  sucursal_id: suc._id,
                  tipo: "delivery",
                })
            : 0;

          detalle = {
            sucursal: suc
              ? {
                  nombre: suc.nombre,
                  restaurante: rest?.nombre || "—",
                  direccion: `${suc.direccion.calle}, ${suc.direccion.zona}`,
                }
              : null,
            entregas: entregasCount,
          };
        }

        return {
          _id: String(u._id),
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          telefono: u.telefono,
          activo: u.activo,
          creado_en: u.creado_en,
          detalle,
        };
      }),
    );

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron obtener usuarios" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getUsersHandler, ["admin"]);

const postUsuarioHandler = async (request) => {
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
    console.error("Error en POST /api/usuarios:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
};

export const POST = withRole(postUsuarioHandler, ["admin"]);
