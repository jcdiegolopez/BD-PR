import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Mis reseñas",
};

async function getMisResenas(userId) {
  const db = await getDb();

  const resenas = await db
    .collection("resenas")
    .find({ usuario_id: new ObjectId(userId) })
    .sort({ creado_en: -1 })
    .toArray();

  const restaurantes = await db.collection("restaurantes").find().toArray();
  const restMap = Object.fromEntries(
    restaurantes.map((r) => [String(r._id), r.nombre]),
  );

  return JSON.parse(
    JSON.stringify(
      resenas.map((r) => ({
        _id: String(r._id),
        restaurante: restMap[String(r.restaurante_id)] || "—",
        calificacion: r.calificacion,
        comentario: r.comentario,
        util_count: r.util_count || 0,
        creado_en: r.creado_en,
      })),
    ),
  );
}

function Stars({ count }) {
  return (
    <span className="text-amber-500 text-sm">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function MisResenasPage() {
  const user = await requireSessionUser(["customer"]);
  const resenas = await getMisResenas(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Mis reseñas</h2>
        <p className="text-text-secondary text-sm mt-1">
          {resenas.length} reseña{resenas.length !== 1 && "s"} publicada
          {resenas.length !== 1 && "s"}
        </p>
      </div>

      {resenas.length === 0 ? (
        <p className="text-text-secondary">No has escrito reseñas aún.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resenas.map((r) => (
            <div
              key={r._id}
              className="rounded-lg border border-text-secondary/10 bg-background-primary p-5 space-y-3"
            >
              {/* Restaurant + stars */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{r.restaurante}</h3>
                <Stars count={r.calificacion} />
              </div>

              {/* Comment */}
              <p className="text-sm text-text-secondary leading-relaxed">
                {r.comentario}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-text-secondary/60">
                <span>{formatDate(r.creado_en)}</span>
                {r.util_count > 0 && (
                  <span>
                    👍 {r.util_count} útil{r.util_count !== 1 && "es"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
