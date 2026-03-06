"use client";

import { useState, useEffect } from "react";

export default function CustomerHomePage() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserEmail(JSON.parse(stored).email || "");
      } catch { /* ignored */ }
    }

    fetch("/api/restaurantes")
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
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-background-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          Hola, {userEmail ? userEmail.split("@")[0] : "Cliente"}
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
            <div>
              <h3 className="text-lg font-semibold">{r.nombre}</h3>
              <p className="text-text-secondary text-sm mt-0.5">
                {r.descripcion}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="rounded-full bg-background-secondary px-2.5 py-0.5 font-medium">
                {r.tipo_cocina}
              </span>
              <span className="text-star">
                ★ {Number(r.calificacion_promedio).toFixed(1)}
              </span>
              <span>{r.total_resenas} reseñas</span>
            </div>

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
