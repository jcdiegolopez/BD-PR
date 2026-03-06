import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Inicio — Customer",
};

async function getRestaurantes() {
  const db = await getDb();

  const restaurantes = await db
    .collection("restaurantes")
    .find({ activo: true })
    .toArray();

  const tiposCocina = await db.collection("tipos_cocina").find().toArray();
  const tipoMap = Object.fromEntries(
    tiposCocina.map((t) => [String(t._id), t.nombre]),
  );

  const sucursales = await db.collection("sucursales").find({ activa: true }).toArray();

  return JSON.parse(
    JSON.stringify(
      restaurantes.map((r) => ({
        _id: String(r._id),
        nombre: r.nombre,
        descripcion: r.descripcion,
        tipo_cocina: tipoMap[String(r.tipo_cocina_id)] || "—",
        tags: r.tags || [],
        calificacion_promedio: r.calificacion_promedio?.toString() || "0",
        total_resenas: r.total_resenas || 0,
        sucursales: sucursales
          .filter((s) => String(s.restaurante_id) === String(r._id))
          .map((s) => ({
            nombre: s.nombre,
            direccion: `${s.direccion.calle}, ${s.direccion.zona}`,
            horario: `${s.horario.apertura} – ${s.horario.cierre}`,
          })),
      })),
    ),
  );
}

export default async function CustomerHomePage() {
  const user = await requireSessionUser(["customer"]);
  const restaurantes = await getRestaurantes();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          Hola, {user.email.split("@")[0]}
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Explora {restaurantes.length} restaurante
          {restaurantes.length !== 1 && "s"} disponibles
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurantes.map((r) => (
          <div
            key={r._id}
            className="rounded-lg border border-text-secondary/10 bg-background-primary p-5 space-y-3 transition-colors hover:border-accent/30"
          >
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold">{r.nombre}</h3>
              <p className="text-text-secondary text-sm mt-0.5">
                {r.descripcion}
              </p>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="rounded-full bg-background-secondary px-2.5 py-0.5 font-medium">
                {r.tipo_cocina}
              </span>
              <span className="text-amber-500">
                ★ {Number(r.calificacion_promedio).toFixed(1)}
              </span>
              <span>{r.total_resenas} reseñas</span>
            </div>

            {/* Tags */}
            {r.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-text-secondary/10 px-2 py-0.5 text-[10px] text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Sucursales */}
            {r.sucursales.length > 0 && (
              <div className="border-t border-text-secondary/10 pt-3 space-y-1.5">
                {r.sucursales.map((s) => (
                  <div key={s.nombre} className="text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {s.nombre}
                    </span>{" "}
                    — {s.direccion}
                    <span className="ml-2 text-text-secondary/60">
                      {s.horario}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}