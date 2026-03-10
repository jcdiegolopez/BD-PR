"use client";

import { useState, useEffect, useCallback } from "react";

export default function MisDireccionesPage() {
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [alias, setAlias] = useState("");
  const [texto, setTexto] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [predeterminada, setPredeterminada] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const loadDirecciones = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/direcciones");
      if (!res.ok) throw new Error("Error al cargar direcciones");
      setDirecciones(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirecciones();
  }, [loadDirecciones]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!alias.trim() || !texto.trim() || !lng || !lat) {
      setFormMsg("Todos los campos son obligatorios");
      return;
    }

    setSubmitting(true);
    setFormMsg("");

    try {
      const res = await fetch("/api/customer/direcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: alias.trim(),
          texto: texto.trim(),
          ubicacion: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          predeterminada,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agregar dirección");

      setAlias("");
      setTexto("");
      setLng("");
      setLat("");
      setPredeterminada(false);
      setFormMsg("Dirección agregada");
      loadDirecciones();
    } catch (err) {
      setFormMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (aliasToDelete) => {
    try {
      const res = await fetch(`/api/customer/direcciones/${encodeURIComponent(aliasToDelete)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }

      loadDirecciones();
    } catch (err) {
      setFormMsg(err.message);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLng(String(pos.coords.longitude));
        setLat(String(pos.coords.latitude));
      },
      () => {}
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="h-64 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Mis direcciones</h2>
        <p className="text-text-secondary text-sm mt-1">
          {direcciones.length}/5 direcciones guardadas
        </p>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      {/* Existing addresses */}
      {direcciones.length === 0 ? (
        <p className="text-text-secondary">No tienes direcciones guardadas.</p>
      ) : (
        <div className="space-y-3">
          {direcciones.map((d) => (
            <div
              key={d.alias}
              className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{d.alias}</p>
                  {d.predeterminada && (
                    <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-medium">
                      Predeterminada
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{d.texto}</p>
                {d.ubicacion?.coordinates && (
                  <p className="text-xs text-text-secondary/60 mt-0.5">
                    {d.ubicacion.coordinates[1].toFixed(4)}, {d.ubicacion.coordinates[0].toFixed(4)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(d.alias)}
                className="text-xs text-accent hover:text-accent-dark shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {direcciones.length < 5 && (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3"
        >
          <h3 className="font-medium">Agregar dirección</h3>
          <input
            type="text"
            placeholder="Alias (ej: Casa, Trabajo)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
          />
          <input
            type="text"
            placeholder="Dirección completa"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
          />
          <div className="flex gap-3">
            <input
              type="number"
              step="any"
              placeholder="Longitud"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="flex-1 rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
            />
            <input
              type="number"
              step="any"
              placeholder="Latitud"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="flex-1 rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
            />
            <button
              type="button"
              onClick={detectLocation}
              className="rounded-md bg-background-secondary px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              📍 Detectar
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={predeterminada}
              onChange={(e) => setPredeterminada(e.target.checked)}
              className="rounded border-text-secondary/30"
            />
            Marcar como predeterminada
          </label>

          {formMsg && <p className="text-sm text-accent">{formMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Agregar dirección"}
          </button>
        </form>
      )}
    </div>
  );
}
