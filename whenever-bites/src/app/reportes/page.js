import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";
import { ObjectId } from "mongodb";

export const metadata = {
  title: "Reportes",
};

export default async function ReportesPage() {
  const user = await requireSessionUser(["owner", "admin"]);
  const db = await getDb();

  // Si es owner, filtrar solo sus restaurantes; si es admin, ver todos
  const filtroRest =
    user.rol === "owner"
      ? { propietario_id: new ObjectId(user.id), activo: true }
      : { activo: true };

  const restaurantes = await db
    .collection("restaurantes")
    .find(filtroRest)
    .toArray();

  const restIds = restaurantes.map((r) => r._id);

  // Total de órdenes y monto por restaurante
  const ordenesAgg = await db
    .collection("ordenes")
    .aggregate([
      { $match: { restaurante_id: { $in: restIds } } },
      {
        $group: {
          _id: "$restaurante_id",
          total_ordenes: { $sum: 1 },
          monto_total: { $sum: { $toDouble: "$monto_total" } },
          completadas: {
            $sum: {
              $cond: [
                { $in: ["$estado_actual", ["completado", "entregado"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ])
    .toArray();

  const aggMap = new Map(ordenesAgg.map((a) => [String(a._id), a]));

  // Reseñas por restaurante
  const resenasAgg = await db
    .collection("resenas")
    .aggregate([
      { $match: { restaurante_id: { $in: restIds } } },
      {
        $group: {
          _id: "$restaurante_id",
          total_resenas: { $sum: 1 },
          promedio: { $avg: "$calificacion" },
        },
      },
    ])
    .toArray();

  const resMap = new Map(resenasAgg.map((r) => [String(r._id), r]));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Reportes analíticos</h2>
        <p className="text-text-secondary">
          Resumen de órdenes y reseñas{user.rol === "owner" ? " de tus restaurantes" : ""}.
        </p>
      </div>

      {restaurantes.length === 0 && (
        <p className="text-text-secondary">Sin restaurantes registrados.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {restaurantes.map((rest) => {
          const stats = aggMap.get(String(rest._id)) || {
            total_ordenes: 0,
            monto_total: 0,
            completadas: 0,
          };
          const res = resMap.get(String(rest._id)) || {
            total_resenas: 0,
            promedio: 0,
          };

          return (
            <div
              key={String(rest._id)}
              className="rounded-lg border border-text-secondary/10 bg-background-secondary p-6 space-y-4"
            >
              <p className="text-lg font-semibold text-text-primary">
                {rest.nombre}
              </p>

              {/* Métricas de órdenes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-background-primary p-3 text-center">
                  <p className="text-2xl font-semibold text-accent">
                    {stats.total_ordenes.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary">Órdenes totales</p>
                </div>
                <div className="rounded-md bg-background-primary p-3 text-center">
                  <p className="text-2xl font-semibold text-accent">
                    {stats.completadas.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary">Completadas</p>
                </div>
                <div className="rounded-md bg-background-primary p-3 text-center">
                  <p className="text-2xl font-semibold text-text-primary">
                    Q{stats.monto_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-text-secondary">Ingreso total</p>
                </div>
                <div className="rounded-md bg-background-primary p-3 text-center">
                  <p className="text-2xl font-semibold text-text-primary">
                    {res.promedio ? res.promedio.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Calificación ({res.total_resenas} reseñas)
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
