import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Mis órdenes",
};

const ESTADO_STYLE = {
  pendiente: "bg-yellow-100 text-yellow-700",
  preparando: "bg-blue-100 text-blue-700",
  listo: "bg-emerald-100 text-emerald-700",
  completado: "bg-emerald-200 text-emerald-800",
  en_camino: "bg-purple-100 text-purple-700",
  entregado: "bg-emerald-200 text-emerald-800",
};

async function getMisOrdenes(userId) {
  const db = await getDb();

  const ordenes = await db
    .collection("ordenes")
    .find({ usuario_id: new ObjectId(userId) })
    .sort({ creado_en: -1 })
    .limit(50)
    .toArray();

  const totalOrdenes = await db
    .collection("ordenes")
    .countDocuments({ usuario_id: new ObjectId(userId) });

  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  const sucursales = await db.collection("sucursales").find().toArray();
  const sucMap = Object.fromEntries(
    sucursales.map((s) => [String(s._id), s.nombre]),
  );

  return {
    total: totalOrdenes,
    ordenes: JSON.parse(
      JSON.stringify(
        ordenes.map((o) => ({
          _id: String(o._id),
          restaurante: restMap[String(o.restaurante_id)] || "—",
          sucursal: sucMap[String(o.sucursal_id)] || "—",
          tipo: o.tipo,
          items: o.items.map((it) => ({
            nombre: it.nombre,
            cantidad: it.cantidad,
            subtotal: it.subtotal?.toString() || "0",
          })),
          monto_total: o.monto_total?.toString() || "0",
          estado_actual: o.estado_actual,
          notas: o.notas,
          creado_en: o.creado_en,
        })),
      ),
    ),
  };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MisOrdenesPage() {
  const user = await requireSessionUser(["customer"]);
  const { total, ordenes } = await getMisOrdenes(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Mis órdenes</h2>
        <p className="text-text-secondary text-sm mt-1">
          {total} orden{total !== 1 && "es"} en total — mostrando las últimas 50
        </p>
      </div>

      {ordenes.length === 0 ? (
        <p className="text-text-secondary">No tienes órdenes aún.</p>
      ) : (
        <div className="space-y-3">
          {ordenes.map((o) => (
            <div
              key={o._id}
              className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">{o.restaurante}</span>
                  <span className="text-text-secondary text-xs ml-2">
                    {o.sucursal}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  {formatDate(o.creado_en)}
                </span>
              </div>

              {/* Estado + tipo */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ESTADO_STYLE[o.estado_actual] || "bg-background-secondary text-text-secondary"}`}
                >
                  {o.estado_actual.replace("_", " ")}
                </span>
                <span className="text-xs text-text-secondary">
                  {o.tipo === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}
                </span>
              </div>

              {/* Items */}
              <div className="border-t border-text-secondary/10 pt-2">
                {o.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs text-text-secondary"
                  >
                    <span>
                      {it.cantidad}× {it.nombre}
                    </span>
                    <span>Q{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-medium mt-1 pt-1 border-t border-text-secondary/10">
                  <span>Total</span>
                  <span>Q{Number(o.monto_total).toFixed(2)}</span>
                </div>
              </div>

              {/* Notas */}
              {o.notas && (
                <p className="text-xs text-text-secondary italic">
                  Nota: {o.notas}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
