import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";
import { ObjectId } from "mongodb";

export const metadata = {
  title: "Sucursales — Owner",
};

export default async function SucursalesPage() {
  const user = await requireSessionUser(["owner"]);
  const db = await getDb();

  const restaurantes = await db
    .collection("restaurantes")
    .find({ propietario_id: new ObjectId(user.id), activo: true })
    .toArray();

  const restIds = restaurantes.map((r) => r._id);
  const restMap = new Map(restaurantes.map((r) => [String(r._id), r]));

  const sucursales = await db
    .collection("sucursales")
    .find({ restaurante_id: { $in: restIds }, activa: true })
    .toArray();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Sucursales</h2>
        <p className="text-text-secondary">
          Consulta y seguimiento de tus sucursales.
        </p>
      </div>

      {sucursales.length === 0 && (
        <p className="text-text-secondary">No tienes sucursales registradas.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sucursales.map((s) => {
          const rest = restMap.get(String(s.restaurante_id));
          return (
            <div
              key={String(s._id)}
              className="rounded-lg border border-text-secondary/10 bg-background-secondary p-6 space-y-3"
            >
              <div className="space-y-1">
                <p className="text-lg font-semibold text-text-primary">
                  {s.nombre}
                </p>
                <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-text-contrast">
                  {rest?.nombre}
                </span>
              </div>

              <div className="space-y-1 text-sm text-text-secondary">
                <p>{s.direccion.calle}</p>
                <p>
                  {s.direccion.zona}, {s.direccion.ciudad}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-secondary">{s.telefono}</span>
              </div>

              <div className="rounded-md bg-background-primary px-3 py-2 text-sm">
                <span className="font-medium text-text-primary">Horario: </span>
                <span className="text-text-secondary">
                  {s.horario.apertura} – {s.horario.cierre}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
