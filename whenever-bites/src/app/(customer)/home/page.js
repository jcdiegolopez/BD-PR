"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function CustomerHomePage() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [totalRestaurantes, setTotalRestaurantes] = useState(0);
  const [tiposCocina, setTiposCocina] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [tipoCocinaId, setTipoCocinaId] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("calificacion_promedio");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserEmail(JSON.parse(stored).email || "");
      } catch { /* ignored */ }
    }

    fetch("/api/tipos-cocina")
      .then((res) => res.ok ? res.json() : [])
      .then(setTiposCocina)
      .catch(() => {});
  }, []);

  const loadRestaurantes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", "9");
      if (search.trim()) {
        // Solo búsqueda por texto, no enviar filtros ni sort
        params.set("search", search.trim());
      } else {
        // Solo filtros y sort, no enviar search
        params.set("sort", sort);
        if (tipoCocinaId) params.set("tipo_cocina_id", tipoCocinaId);
        if (tagFilter.trim()) params.set("tags", tagFilter.trim());
      }

      const res = await fetch(`/api/restaurantes?${params}`);
      if (!res.ok) throw new Error("Error al cargar restaurantes");
      const payload = await res.json();

      const data = Array.isArray(payload) ? payload : payload.data || [];
      const total = payload.total || data.length;
      setRestaurantes(data);
      setTotalRestaurantes(total);
      setTotalPages(payload.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoCocinaId, tagFilter, sort]);

  useEffect(() => {
    loadRestaurantes();
  }, [loadRestaurantes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          Hola, {userEmail ? userEmail.split("@")[0] : "Cliente"}
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Explora {totalRestaurantes} restaurante
          {totalRestaurantes !== 1 && "s"} disponibles
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar restaurante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={tipoCocinaId}
            onChange={(e) => { setTipoCocinaId(e.target.value); setPage(1); }}
            className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
          >
            <option value="">Todos los tipos</option>
            {tiposCocina.map((tc) => (
              <option key={tc._id} value={tc._id}>{tc.nombre}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filtrar por tag..."
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
          />

          {!search.trim() && (
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
            >
              <option value="calificacion_promedio">Mejor calificación</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-background-secondary" />
          ))}
        </div>
      ) : error ? (
        <p className="text-accent">{error}</p>
      ) : restaurantes.length === 0 ? (
        <p className="text-text-secondary">No se encontraron restaurantes.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantes.map((r) => (
              <Link
                key={r._id}
                href={`/home/restaurante/${r._id}`}
                className="rounded-lg border border-text-secondary/10 bg-background-primary p-5 space-y-3 transition-colors hover:border-accent/30 block"
              >
                <div>
                  <h3 className="text-lg font-semibold">{r.nombre}</h3>
                  <p className="text-text-secondary text-sm mt-0.5">{r.descripcion}</p>
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

                {r.tags?.length > 0 && (
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

                {r.sucursales?.length > 0 && (
                  <div className="border-t border-text-secondary/10 pt-3 space-y-1.5">
                    {r.sucursales.map((s) => (
                      <div key={s.nombre} className="text-xs text-text-secondary">
                        <span className="font-medium text-text-primary">{s.nombre}</span>
                        {" — "}{s.direccion}
                        <span className="ml-2 text-text-secondary/60">{s.horario}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-text-secondary/20 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-text-secondary">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-text-secondary/20 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
