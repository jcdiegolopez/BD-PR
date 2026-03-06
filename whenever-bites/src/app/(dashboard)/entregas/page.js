import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Entregas — Repartidor",
};

const ESTADO_STYLE = {
  pendiente: "bg-yellow-100 text-yellow-700",
  preparando: "bg-blue-100 text-blue-700",
  listo: "bg-emerald-100 text-emerald-700",
  en_camino: "bg-purple-100 text-purple-700",
  entregado: "bg-emerald-200 text-emerald-800",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
};

async function getEntregas(sucursalId) {
  const db = await getDb();

  const sid = new ObjectId(sucursalId);

  // Active delivery orders for this branch: listo or en_camino
  const activas = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: { $in: ["listo", "en_camino"] },
    })
    .sort({ creado_en: 1 })
    .toArray();

  // Pending/preparing orders (upcoming)
  const enPreparacion = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: { $in: ["pendiente", "preparando"] },
    })
    .sort({ creado_en: 1 })
    .limit(20)
    .toArray();

  // Recently completed deliveries
  const completadas = await db
    .collection("ordenes")
    .find({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: "entregado",
    })
    .sort({ creado_en: -1 })
    .limit(20)
    .toArray();

  // Stats
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const entregadasHoy = await db
    .collection("ordenes")
    .countDocuments({
      sucursal_id: sid,
      tipo: "delivery",
      estado_actual: "entregado",
      creado_en: { $gte: hoy },
    });

  const totalDelivery = await db
    .collection("ordenes")
    .countDocuments({
      sucursal_id: sid,
      tipo: "delivery",
    });

  // Restaurant & customer maps
  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  const sucursales = await db.collection("sucursales").find().toArray();
  const sucMap = Object.fromEntries(
    sucursales.map((s) => [String(s._id), s.nombre]),
  );

  const usuarios = await db
    .collection("usuarios")
    .find({ rol: "customer" })
    .toArray();
  const userMap = Object.fromEntries(
    usuarios.map((u) => [String(u._id), { nombre: u.nombre, telefono: u.telefono }]),
  );

  const serialize = (ordenes) =>
    JSON.parse(
      JSON.stringify(
        ordenes.map((o) => ({
          _id: String(o._id),
          restaurante: restMap[String(o.restaurante_id)] || "—",
          sucursal: sucMap[String(o.sucursal_id)] || "—",
          cliente: userMap[String(o.usuario_id)]?.nombre || "Cliente",
          cliente_tel: userMap[String(o.usuario_id)]?.telefono || "",
          items: o.items.map((it) => ({
            nombre: it.nombre,
            cantidad: it.cantidad,
            subtotal: it.subtotal?.toString() || "0",
          })),
          monto_total: o.monto_total?.toString() || "0",
          estado_actual: o.estado_actual,
          direccion_entrega: o.direccion_entrega?.texto || "—",
          notas: o.notas,
          creado_en: o.creado_en,
        })),
      ),
    );

  // Sucursal info
  const sucursal = sucursales.find((s) => String(s._id) === sucursalId);
  const restName = sucursal
    ? restMap[String(sucursal.restaurante_id)] || "—"
    : "—";
  const sucName = sucursal ? sucursal.nombre : "—";

  return {
    sucursalLabel: `${restName} — ${sucName}`,
    stats: {
      activas: activas.length,
      enPreparacion: enPreparacion.length,
      entregadasHoy,
      totalDelivery,
    },
    activas: serialize(activas),
    enPreparacion: serialize(enPreparacion),
    completadas: serialize(completadas),
  };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ o, showAddress = false }) {
  return (
    <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold">{o.restaurante}</span>
          <span className="text-text-secondary text-xs ml-2">{o.sucursal}</span>
        </div>
        <span className="text-xs text-text-secondary">
          {formatDate(o.creado_en)}
        </span>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ESTADO_STYLE[o.estado_actual] || "bg-background-secondary text-text-secondary"}`}
        >
          {ESTADO_LABEL[o.estado_actual] || o.estado_actual}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">👤</span>
        <span className="font-medium">{o.cliente}</span>
        {o.cliente_tel && (
          <span className="text-xs text-text-secondary">{o.cliente_tel}</span>
        )}
      </div>

      {/* Dirección */}
      {showAddress && o.direccion_entrega !== "—" && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-text-secondary">📍</span>
          <span className="text-text-secondary">{o.direccion_entrega}</span>
        </div>
      )}

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
        <p className="text-xs text-text-secondary italic">⚠️ {o.notas}</p>
      )}
    </div>
  );
}

export default async function EntregasPage() {
  const user = await requireSessionUser(["repartidor"]);

  // Get repartidor's assigned branch
  const db = await getDb();
  const repartidor = await db
    .collection("usuarios")
    .findOne({ _id: new ObjectId(user.id) });

  if (!repartidor?.sucursal_asignada) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Entregas</h2>
        <p className="text-text-secondary">
          No tienes una sucursal asignada. Contacta al administrador.
        </p>
      </div>
    );
  }

  const data = await getEntregas(String(repartidor.sucursal_asignada));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Entregas</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data.sucursalLabel}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">{data.stats.activas}</p>
          <p className="text-xs text-text-secondary mt-1">Por entregar</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.stats.enPreparacion}</p>
          <p className="text-xs text-text-secondary mt-1">En preparación</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{data.stats.entregadasHoy}</p>
          <p className="text-xs text-text-secondary mt-1">Entregadas hoy</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{data.stats.totalDelivery}</p>
          <p className="text-xs text-text-secondary mt-1">Total histórico</p>
        </div>
      </div>

      {/* Active — listo / en_camino */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🛵 Entregas activas
          {data.activas.length > 0 && (
            <span className="text-xs font-normal bg-accent/10 text-accent rounded-full px-2 py-0.5">
              {data.activas.length}
            </span>
          )}
        </h3>

        {data.activas.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay entregas pendientes en este momento.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activas.map((o) => (
              <OrderCard key={o._id} o={o} showAddress />
            ))}
          </div>
        )}
      </section>

      {/* In preparation — pendiente / preparando */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🍳 En preparación
          {data.enPreparacion.length > 0 && (
            <span className="text-xs font-normal bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
              {data.enPreparacion.length}
            </span>
          )}
        </h3>

        {data.enPreparacion.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay órdenes en preparación.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.enPreparacion.map((o) => (
              <OrderCard key={o._id} o={o} showAddress />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">✅ Entregas recientes</h3>

        {data.completadas.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay entregas completadas aún.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.completadas.map((o) => (
              <OrderCard key={o._id} o={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
