import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withRole } from "@/lib/middleware";

/**
 * GET /api/admin/sucursales/[id]/staff
 * Query: Q04 - find({ sucursal_asignada })
 * Índice: IDX-10
 * 
 * Obtiene todos los workers y repartidores asignados a una sucursal específica
 */
const getStaffHandler = async (request, context, user) => {
  try {
    const { id } = context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de sucursal inválido" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const sucursalId = new ObjectId(id);

    // Verificar que la sucursal existe
    const sucursal = await db
      .collection("sucursales")
      .findOne({ _id: sucursalId });

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 },
      );
    }

    // Q04: find({ sucursal_asignada })
    // Índice: IDX-10
    // Obtener workers y repartidores de la sucursal
    const staff = await db
      .collection("usuarios")
      .find(
        {
          sucursal_asignada: sucursalId,
          rol: { $in: ["worker", "repartidor"] },
          activo: true,
        },
        { projection: { password_hash: 0 } },
      )
      .sort({ nombre: 1 })
      .toArray();

    // Enriquecer con información del restaurante
    const restaurant = await db
      .collection("restaurantes")
      .findOne({ _id: sucursal.restaurante_id });

    const enriched = staff.map((u) => ({
      _id: String(u._id),
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      telefono: u.telefono || null,
      activo: u.activo,
      sucursal: {
        _id: String(sucursal._id),
        nombre: sucursal.nombre,
        restaurante: restaurant?.nombre || "—",
      },
    }));

    return NextResponse.json({
      sucursal: {
        _id: String(sucursal._id),
        nombre: sucursal.nombre,
        restaurante: restaurant?.nombre || "—",
      },
      staff: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/sucursales/[id]/staff:", error);
    return NextResponse.json(
      { error: "No se pudo obtener el staff de la sucursal" },
      { status: 500 },
    );
  }
};

export const GET = withRole(getStaffHandler, ["admin"]);
