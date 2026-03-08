"use client";

import { useMemo, useState } from "react";

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() - 120);
  return date.toISOString().slice(0, 10);
}

export default function LimpiezaPage() {
  const [before, setBefore] = useState(getDefaultDate());
  const [includeCompletado, setIncludeCompletado] = useState(true);
  const [includeEntregado, setIncludeEntregado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectedStates = useMemo(() => {
    const states = [];
    if (includeCompletado) states.push("completado");
    if (includeEntregado) states.push("entregado");
    return states;
  }, [includeCompletado, includeEntregado]);

  const runCleanup = async (dryRun) => {
    if (selectedStates.length === 0) {
      setError("Selecciona al menos un estado para limpiar.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/ordenes/limpieza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          before,
          estados: selectedStates,
          dryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo ejecutar la limpieza");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Limpieza historica de ordenes</h2>
        <p className="text-sm text-text-secondary mt-1">
          Q22: elimina ordenes antiguas usando bulkWrite deleteMany.
        </p>
      </div>

      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Eliminar ordenes creadas antes de</label>
          <input
            type="date"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Estados incluidos</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeCompletado}
              onChange={(e) => setIncludeCompletado(e.target.checked)}
            />
            completado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEntregado}
              onChange={(e) => setIncludeEntregado(e.target.checked)}
            />
            entregado
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runCleanup(true)}
            disabled={loading}
            className="rounded-md border border-text-secondary/20 px-3 py-2 text-sm font-medium hover:bg-background-secondary disabled:opacity-60"
          >
            {loading ? "Procesando..." : "Previsualizar (dry-run)"}
          </button>
          <button
            type="button"
            onClick={() => runCleanup(false)}
            disabled={loading}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Procesando..." : "Ejecutar limpieza"}
          </button>
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}
      </div>

      {result && (
        <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">Modo:</span>{" "}
            {result.dryRun ? "Previsualizacion" : "Ejecucion real"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Fecha corte:</span>{" "}
            {new Date(result.before).toLocaleString("es-GT")}
          </p>
          <p className="text-sm">
            <span className="font-medium">Candidatas:</span> {result.totalCandidates}
          </p>
          {result.deletedCount !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Eliminadas:</span> {result.deletedCount}
            </p>
          )}

          {Array.isArray(result.detalle) && result.detalle.length > 0 && (
            <div className="pt-2 space-y-1">
              <p className="text-sm font-medium">Detalle por estado</p>
              {result.detalle.map((row) => (
                <p key={row.estado} className="text-sm text-text-secondary">
                  {row.estado}: {row.candidatos}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
