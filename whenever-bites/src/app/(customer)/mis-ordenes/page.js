"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ESTADO_STYLE = {
  pendiente: "bg-status-pending-bg text-status-pending-text",
  preparando: "bg-status-progress-bg text-status-progress-text",
  listo: "bg-status-success-bg text-status-success-text",
  completado: "bg-status-success-alt-bg text-status-success-alt-text",
  en_camino: "bg-status-transit-bg text-status-transit-text",
  entregado: "bg-status-success-alt-bg text-status-success-alt-text",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MisOrdenesPage() {
  const [data, setData] = useState({ total: 0, ordenes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customer/ordenes")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar órdenes");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-background-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
  }

  const { total, ordenes } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Mis órdenes</h2>
        <p className="text-text-secondary text-sm mt-1">
          {total} orden{total !== 1 && "es"} en total — mostrando las últimas 50
        </p>
      </div>

      {ordenes.length === 0 ? (
        <p className="text-text-secondary">No tienes órdenes aún.</p>
      ) : (
        <div className="space-y-3">
          {ordenes.map((o) => (
            <Link
              href={`/mis-ordenes/${o._id}`}
              key={o._id}
              className="block rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2 transition-colors duration-200 hover:border-accent/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">{o.restaurante}</span>
                  <span className="text-text-secondary text-xs ml-2">
                    {o.sucursal}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  {formatDate(o.creado_en)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ESTADO_STYLE[o.estado_actual] || "bg-background-secondary text-text-secondary"}`}
                >
                  {o.estado_actual.replace("_", " ")}
                </span>
                <span className="text-xs text-text-secondary">
                  {o.tipo === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}
                </span>
              </div>

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

              {o.notas && (
                <p className="text-xs text-text-secondary italic">
                  Nota: {o.notas}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
