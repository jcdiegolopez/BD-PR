"use client";

import { useEffect, useState } from "react";

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/restaurantes")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar restaurantes");
        return res.json();
      })
      .then(setRestaurantes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-background-secondary" />
        <div className="h-96 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
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
            const listaSucursales = restaurante.sucursales || [];

            return (
              <article
                key={restaurante._id}
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
                    {restaurante.owner_nombre}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Contacto:
                    </span>{" "}
                    {restaurante.owner_email}
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
                        key={sucursal._id}
                        className="text-xs text-text-secondary"
                      >
                        {sucursal.nombre} - {sucursal.zona}
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
