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

function getWorkerNextState(order) {
  if (order.estado_actual === "pendiente") return "preparando";
  if (order.estado_actual === "preparando") return "listo";
  if (order.estado_actual === "listo" && order.tipo === "pickup") {
    return "completado";
  }
  return null;
}

function getWorkerActionLabel(nextState) {
  if (nextState === "preparando") return "Pasar a preparando";
  if (nextState === "listo") return "Marcar listo";
  if (nextState === "completado") return "Marcar completado";
  return "";
}


function OrderCard({ o, onAdvance, isUpdating, onShowDetail }) {
  const nextState = getWorkerNextState(o);

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

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onShowDetail(o._id)}
          className="flex-1 rounded-md border border-accent text-accent px-3 py-2 text-sm font-medium hover:bg-accent/10"
        >
          Ver detalle
        </button>
        {nextState && (
          <button
            type="button"
            onClick={() => onAdvance(o._id, nextState)}
            disabled={isUpdating}
            className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Actualizando..." : getWorkerActionLabel(nextState)}
          </button>
        )}
      </div>

      {!nextState && o.estado_actual === "listo" && o.tipo === "delivery" && (
        <p className="text-xs text-text-secondary">
          Esperando que repartidor tome la orden.
        </p>
      )}
    </div>
  );
}


import { useRef } from "react";

function DetailModal({ open, onClose, order }) {
  if (!open || !order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-primary rounded-lg p-6 w-full max-w-md shadow-lg relative">
        <button
          className="absolute top-2 right-2 text-text-secondary hover:text-accent"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2">Detalle de la orden</h2>
        <div className="mb-2 text-sm text-text-secondary">
          <div><b>ID:</b> {order._id}</div>
          <div><b>Restaurante:</b> {order.restaurante || "-"}</div>
          <div><b>Sucursal:</b> {order.sucursal || "-"}</div>
          <div><b>Tipo:</b> {order.tipo}</div>
          <div><b>Estado actual:</b> {order.estado_actual}</div>
          <div><b>Cliente:</b> {order.cliente || "-"}</div>
          <div><b>Teléfono:</b> {order.cliente_tel || "-"}</div>
          <div><b>Creado en:</b> {formatTime(order.creado_en)}</div>
        </div>
        <div className="mb-2">
          <b>Items:</b>
          <ul className="list-disc pl-5 text-sm">
            {order.items?.map((it, i) => (
              <li key={i}>
                {it.cantidad}× {it.nombre} — Q{Number(it.subtotal).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
        {order.direccion_entrega && (
          <div className="mb-2 text-sm">
            <b>Dirección de entrega:</b> {order.direccion_entrega}
          </div>
        )}
        {order.notas && (
          <div className="mb-2 text-sm text-accent">
            <b>Notas:</b> {order.notas}
          </div>
        )}
        {order.historial_estados && (
          <div className="mb-2 text-sm">
            <b>Historial de estados:</b>
            <ul className="list-disc pl-5">
              {order.historial_estados.map((h, i) => (
                <li key={i}>
                  {h.estado} — {formatTime(h.timestamp)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ColaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const detailCache = useRef({});

  const loadOrders = async () => {
    const res = await fetch("/api/ordenes");
    if (res.status === 400) {
      const d = await res.json();
      throw new Error(
        d.error || "No tienes una sucursal asignada. Contacta al administrador.",
      );
    }
    if (!res.ok) {
      throw new Error("Error al cargar la cola de órdenes");
    }
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

  const showOrderDetail = async (orderId) => {
    setError("");
    setDetailOrder(null);
    setDetailOpen(true);
    // Cache para evitar fetch repetidos
    if (detailCache.current[orderId]) {
      setDetailOrder(detailCache.current[orderId]);
      return;
    }
    try {
      const res = await fetch(`/api/ordenes/${orderId}`);
      if (!res.ok) {
        throw new Error("No se pudo cargar el detalle de la orden");
      }
      const order = await res.json();
      detailCache.current[orderId] = order;
      setDetailOrder(order);
    } catch (err) {
      setError(err.message);
      setDetailOpen(false);
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
        <h2 className="text-2xl font-semibold">Cola de órdenes</h2>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} order={detailOrder} />
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
              <OrderCard
                key={o._id}
                o={o}
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
                onShowDetail={showOrderDetail}
              />
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
              <OrderCard
                key={o._id}
                o={o}
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
                onShowDetail={showOrderDetail}
              />
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
              <OrderCard
                key={o._id}
                o={o}
                onAdvance={changeOrderState}
                isUpdating={updatingId === o._id}
                onShowDetail={showOrderDetail}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
