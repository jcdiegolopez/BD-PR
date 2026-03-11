"use client";

import { useEffect, useState } from "react";

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/owner/sucursales")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar sucursales");
        return res.json();
      })
      .then(setSucursales)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="h-80 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
  }

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
          return (
            <div
              key={s._id}
              className="rounded-lg border border-text-secondary/10 bg-background-secondary p-6 space-y-3"
            >
              <div className="space-y-1">
                <p className="text-lg font-semibold text-text-primary">
                  {s.nombre}
                </p>
                <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-text-contrast">
                  {s.restaurante_nombre}
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
