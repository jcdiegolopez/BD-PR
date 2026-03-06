"use client";

import { useState, useEffect } from "react";

const ESTADO_STYLE = {
  pendiente: "bg-status-pending-bg text-status-pending-text",
  preparando: "bg-status-progress-bg text-status-progress-text",
  listo: "bg-status-success-bg text-status-success-text",
  completado: "bg-status-success-alt-bg text-status-success-alt-text",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo",
  completado: "Completado",
};

function formatTime(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeSince(d) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function OrderCard({ o }) {
  return (
    <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ESTADO_STYLE[o.estado_actual] || "bg-background-secondary text-text-secondary"}`}
          >
            {ESTADO_LABEL[o.estado_actual] || o.estado_actual}
          </span>
          <span className="text-xs text-text-secondary">
            {o.tipo === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}
          </span>
        </div>
        <span className="text-xs text-text-secondary" title={formatTime(o.creado_en)}>
          ⏱ {timeSince(o.creado_en)}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">👤</span>
        <span className="font-medium">{o.cliente}</span>
        {o.cliente_tel && (
          <span className="text-xs text-text-secondary">{o.cliente_tel}</span>
        )}
      </div>

      {/* Items */}
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

      {/* Dirección delivery */}
      {o.tipo === "delivery" && o.direccion_entrega && (
        <div className="flex items-start gap-2 text-xs text-text-secondary">
          <span>📍</span>
          <span>{o.direccion_entrega}</span>
        </div>
      )}

      {/* Notas */}
      {o.notas && (
        <p className="text-xs text-accent font-medium">⚠️ {o.notas}</p>
      )}
    </div>
  );
}

export default function ColaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ordenes")
      .then((res) => {
        if (res.status === 400) {
          return res.json().then((d) => {
            throw new Error(
              d.error ||
                "No tienes una sucursal asignada. Contacta al administrador.",
            );
          });
        }
        if (!res.ok) throw new Error("Error al cargar la cola de órdenes");
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-background-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Cola de órdenes</h2>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Cola de órdenes</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data.sucursalLabel}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-status-pending-text">
            {data.stats.pendientes}
          </p>
          <p className="text-xs text-text-secondary mt-1">Pendientes</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-status-progress-text">
            {data.stats.preparando}
          </p>
          <p className="text-xs text-text-secondary mt-1">Preparando</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-status-success-text">
            {data.stats.completadosHoy}
          </p>
          <p className="text-xs text-text-secondary mt-1">Completados hoy</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {data.stats.totalHoy}
          </p>
          <p className="text-xs text-text-secondary mt-1">Total hoy</p>
        </div>
      </div>

      {/* Pendientes */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🔔 Pendientes
          {data.pendientes.length > 0 && (
            <span className="text-xs font-normal bg-status-pending-bg text-status-pending-text rounded-full px-2 py-0.5">
              {data.pendientes.length}
            </span>
          )}
        </h3>

        {data.pendientes.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay órdenes pendientes.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.pendientes.map((o) => (
              <OrderCard key={o._id} o={o} />
            ))}
          </div>
        )}
      </section>

      {/* Preparando */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🍳 En preparación
          {data.preparando.length > 0 && (
            <span className="text-xs font-normal bg-status-progress-bg text-status-progress-text rounded-full px-2 py-0.5">
              {data.preparando.length}
            </span>
          )}
        </h3>

        {data.preparando.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay órdenes en preparación.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.preparando.map((o) => (
              <OrderCard key={o._id} o={o} />
            ))}
          </div>
        )}
      </section>

      {/* Listos */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ✅ Listos para recoger / despachar
          {data.listos.length > 0 && (
            <span className="text-xs font-normal bg-status-success-bg text-status-success-text rounded-full px-2 py-0.5">
              {data.listos.length}
            </span>
          )}
        </h3>

        {data.listos.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay órdenes listas en este momento.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.listos.map((o) => (
              <OrderCard key={o._id} o={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
