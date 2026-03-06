import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

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
