"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

export default function OrdenDetallePage() {
  const { id } = useParams();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review form state
  const [showReview, setShowReview] = useState(false);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    fetch(`/api/ordenes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Orden no encontrada");
        return res.json();
      })
      .then(setOrden)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) {
      setReviewMsg("Escribe un comentario");
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg("");

    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurante_id: orden.restaurante_id,
          orden_id: orden._id,
          calificacion,
          comentario: comentario.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar reseña");

      setReviewMsg("¡Reseña enviada!");
      setShowReview(false);
    } catch (err) {
      setReviewMsg(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="h-64 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="space-y-4">
        <p className="text-accent">{error || "No encontrada"}</p>
        <Link href="/mis-ordenes" className="text-sm text-accent hover:text-accent-dark">
          ← Volver a mis órdenes
        </Link>
      </div>
    );
  }

  const canReview = ["completado", "entregado"].includes(orden.estado_actual);

  return (
    <div className="space-y-6">
      <Link href="/mis-ordenes" className="text-sm text-accent hover:text-accent-dark">
        ← Volver a mis órdenes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{orden.restaurante}</h2>
          <p className="text-sm text-text-secondary">{orden.sucursal}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLE[orden.estado_actual] || "bg-background-secondary text-text-secondary"}`}
        >
          {orden.estado_actual.replace("_", " ")}
        </span>
      </div>

      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Tipo</span>
          <span>{orden.tipo === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Fecha</span>
          <span>{formatDate(orden.creado_en)}</span>
        </div>
        {orden.notas && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Notas</span>
            <span className="text-right max-w-[60%]">{orden.notas}</span>
          </div>
        )}
        {orden.direccion_entrega && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Dirección</span>
            <span className="text-right max-w-[60%]">{orden.direccion_entrega.texto}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
        <h3 className="font-medium">Platillos</h3>
        {(orden.items || []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm text-text-secondary">
            <span>{item.cantidad}× {item.nombre}</span>
            <span>Q{Number(item.subtotal).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold border-t border-text-secondary/10 pt-2 mt-2">
          <span>Total</span>
          <span>Q{Number(orden.monto_total).toFixed(2)}</span>
        </div>
      </div>

      {/* Status history */}
      {orden.historial_estados?.length > 0 && (
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
          <h3 className="font-medium">Historial de estados</h3>
          {orden.historial_estados.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-sm text-text-secondary">
              <span className="capitalize">{h.estado?.replace("_", " ")}</span>
              <span className="text-xs">{h.fecha ? formatDate(h.fecha) : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review section */}
      {canReview && (
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3">
          {!showReview ? (
            <button
              onClick={() => setShowReview(true)}
              className="text-sm font-medium text-accent hover:text-accent-dark"
            >
              ✍️ Dejar una reseña
            </button>
          ) : (
            <form onSubmit={handleReview} className="space-y-3">
              <h3 className="font-medium">Escribir reseña</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    className={`text-xl transition-colors duration-200 ${star <= calificacion ? "text-star" : "text-text-secondary/30"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                placeholder="Cuéntanos tu experiencia..."
                className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60 resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
                >
                  {reviewSubmitting ? "Enviando..." : "Enviar reseña"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {reviewMsg && <p className="text-sm text-accent">{reviewMsg}</p>}
        </div>
      )}
    </div>
  );
}
