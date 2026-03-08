"use client";

import { useState, useEffect } from "react";

const ESTADO_STYLE = {
  pendiente: "bg-status-pending-bg text-status-pending-text",
  preparando: "bg-status-progress-bg text-status-progress-text",
  listo: "bg-status-success-bg text-status-success-text",
  en_camino: "bg-status-transit-bg text-status-transit-text",
  entregado: "bg-status-success-alt-bg text-status-success-alt-text",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRepartidorNextState(order) {
  if (order.estado_actual === "listo") return "en_camino";
  if (order.estado_actual === "en_camino") return "entregado";
  return null;
}

function getRepartidorActionLabel(nextState) {
  if (nextState === "en_camino") return "Iniciar entrega";
  if (nextState === "entregado") return "Marcar entregado";
  return "";
}

function OrderCard({ o, showAddress = false, onAdvance, isUpdating = false }) {
  const nextState = getRepartidorNextState(o);

  return (
    <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold">{o.restaurante}</span>
          <span className="text-text-secondary text-xs ml-2">{o.sucursal}</span>
        </div>
        <span className="text-xs text-text-secondary">
          {formatDate(o.creado_en)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ESTADO_STYLE[o.estado_actual] || "bg-background-secondary text-text-secondary"}`}
        >
          {ESTADO_LABEL[o.estado_actual] || o.estado_actual}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">👤</span>
        <span className="font-medium">{o.cliente}</span>
        {o.cliente_tel && (
          <span className="text-xs text-text-secondary">{o.cliente_tel}</span>
        )}
      </div>

      {showAddress && o.direccion_entrega !== "—" && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-text-secondary">📍</span>
          <span className="text-text-secondary">{o.direccion_entrega}</span>
        </div>
      )}

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
        <p className="text-xs text-text-secondary italic">⚠️ {o.notas}</p>
      )}

      {nextState && (
        <button
          type="button"
          onClick={() => onAdvance(o._id, nextState)}
          disabled={isUpdating}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating ? "Actualizando..." : getRepartidorActionLabel(nextState)}
        </button>
      )}
    </div>
  );
}

export default function EntregasPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadOrders = async () => {
    const res = await fetch("/api/ordenes");

    if (res.status === 400) {
      const d = await res.json();
      throw new Error(
        d.error || "No tienes una sucursal asignada. Contacta al administrador.",
      );
    }

    if (!res.ok) throw new Error("Error al cargar entregas");

    return res.json();
  };

  const changeOrderState = async (orderId, nextState) => {
    setUpdatingId(orderId);
    setError("");

    try {
      const res = await fetch(`/api/ordenes/${orderId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nextState }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo actualizar la orden");
      }

      const freshData = await loadOrders();
      setData(freshData);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId("");
    }
  };

  useEffect(() => {
    loadOrders()
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
        <h2 className="text-2xl font-semibold">Entregas</h2>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Entregas</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data.sucursalLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {data.stats.activas}
          </p>
          <p className="text-xs text-text-secondary mt-1">Por entregar</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-status-progress-text">
            {data.stats.enPreparacion}
          </p>
          <p className="text-xs text-text-secondary mt-1">En preparación</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-status-success-text">
            {data.stats.entregadasHoy}
          </p>
          <p className="text-xs text-text-secondary mt-1">Entregadas hoy</p>
        </div>
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {data.stats.totalDelivery}
          </p>
          <p className="text-xs text-text-secondary mt-1">Total histórico</p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🛵 Entregas activas
          {data.activas.length > 0 && (
            <span className="text-xs font-normal bg-accent/10 text-accent rounded-full px-2 py-0.5">
              {data.activas.length}
            </span>
          )}
        </h3>

        {data.activas.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay entregas pendientes en este momento.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activas.map((o) => (
              <OrderCard
                key={o._id}
                o={o}
                showAddress
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🍳 En preparación
          {data.enPreparacion.length > 0 && (
            <span className="text-xs font-normal bg-status-progress-bg text-status-progress-text rounded-full px-2 py-0.5">
              {data.enPreparacion.length}
            </span>
          )}
        </h3>

        {data.enPreparacion.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay órdenes en preparación.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.enPreparacion.map((o) => (
              <OrderCard
                key={o._id}
                o={o}
                showAddress
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">✅ Entregas recientes</h3>

        {data.completadas.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No hay entregas completadas aún.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.completadas.map((o) => (
              <OrderCard
                key={o._id}
                o={o}
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
