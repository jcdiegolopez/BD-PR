import { getDb } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Restaurantes — Admin",
};

export default async function RestaurantesPage() {
  await requireSessionUser(["admin"]);
  const db = await getDb();

  const restaurantes = await db
    .collection("restaurantes")
    .find({})
    .sort({ creado_en: -1 })
    .toArray();

  const ownerIds = restaurantes
    .map((restaurante) => restaurante.propietario_id)
    .filter(Boolean);

  const owners = ownerIds.length
    ? await db
        .collection("usuarios")
        .find({ _id: { $in: ownerIds } })
        .project({ nombre: 1, email: 1 })
        .toArray()
    : [];

  const ownerMap = new Map(
    owners.map((owner) => [String(owner._id), owner]),
  );

  const restIds = restaurantes.map((restaurante) => restaurante._id);

  const sucursales = restIds.length
    ? await db
        .collection("sucursales")
        .find({ restaurante_id: { $in: restIds } })
        .toArray()
    : [];

  const sucursalesPorRestaurante = new Map();
  for (const sucursal of sucursales) {
    const key = String(sucursal.restaurante_id);
    if (!sucursalesPorRestaurante.has(key)) {
      sucursalesPorRestaurante.set(key, []);
    }
    sucursalesPorRestaurante.get(key).push(sucursal);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Gestion de restaurantes</h2>
        <p className="text-sm text-text-secondary mt-1">
          {restaurantes.length} restaurante{restaurantes.length !== 1 && "s"}{" "}
          registrado{restaurantes.length !== 1 && "s"} en el sistema.
        </p>
      </div>

      {restaurantes.length === 0 ? (
        <p className="text-text-secondary">No hay restaurantes registrados.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurantes.map((restaurante) => {
            const owner = ownerMap.get(String(restaurante.propietario_id));
            const listaSucursales =
              sucursalesPorRestaurante.get(String(restaurante._id)) || [];

            return (
              <article
                key={String(restaurante._id)}
                className="rounded-lg border border-text-secondary/10 bg-background-secondary p-6 space-y-3"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {restaurante.nombre}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {restaurante.descripcion}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(restaurante.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-background-primary px-2 py-1 text-xs text-text-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-1 text-sm text-text-secondary">
                  <p>
                    <span className="font-medium text-text-primary">Owner:</span>{" "}
                    {owner?.nombre || "Sin asignar"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Contacto:
                    </span>{" "}
                    {owner?.email || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Calificacion:
                    </span>{" "}
                    {Number(restaurante.calificacion_promedio || 0).toFixed(1)}
                    {" "}
                    ({restaurante.total_resenas || 0} resenas)
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Sucursales:
                    </span>{" "}
                    {listaSucursales.length}
                  </p>
                </div>

                {listaSucursales.length > 0 && (
                  <div className="border-t border-text-secondary/10 pt-3 space-y-1">
                    {listaSucursales.slice(0, 3).map((sucursal) => (
                      <p
                        key={String(sucursal._id)}
                        className="text-xs text-text-secondary"
                      >
                        {sucursal.nombre} - {sucursal.direccion?.zona || "Sin zona"}
                      </p>
                    ))}
                    {listaSucursales.length > 3 && (
                      <p className="text-xs text-text-secondary/80">
                        +{listaSucursales.length - 3} sucursal
                        {listaSucursales.length - 3 !== 1 && "es"}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
