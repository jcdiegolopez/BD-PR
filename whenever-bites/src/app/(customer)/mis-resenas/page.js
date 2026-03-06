"use client";

import { useState, useEffect } from "react";

function Stars({ count }) {
  return (
    <span className="text-star text-sm">
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

export default function MisResenasPage() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resenas")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar reseñas");
        return res.json();
      })
      .then(setResenas)
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
              className="h-40 animate-pulse rounded-lg bg-background-secondary"
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{r.restaurante}</h3>
                <Stars count={r.calificacion} />
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                {r.comentario}
              </p>

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
