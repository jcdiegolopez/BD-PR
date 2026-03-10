"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

export default function RestauranteDetallePage() {
  const { id } = useParams();
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [menu, setMenu] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchMenu, setSearchMenu] = useState("");
  const [tagMenu, setTagMenu] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [tab, setTab] = useState("menu");

  useEffect(() => {
    async function load() {
      try {
        const [restRes, catRes, menuRes, sucRes, resRes] = await Promise.all([
          fetch(`/api/restaurantes/${id}`),
          fetch(`/api/restaurantes/${id}/categorias`),
          fetch(`/api/restaurantes/${id}/menu`),
          fetch(`/api/restaurantes/${id}/sucursales`),
          fetch(`/api/restaurantes/${id}/resenas`),
        ]);

        if (!restRes.ok) throw new Error("Restaurante no encontrado");

        const restData = await restRes.json();
        const catData = catRes.ok ? await catRes.json() : [];
        const menuData = menuRes.ok ? await menuRes.json() : [];
        const sucData = sucRes.ok ? await sucRes.json() : [];
        const resData = resRes.ok ? await resRes.json() : [];

        setRestaurante(restData);
        setCategorias(Array.isArray(catData) ? catData : catData.data || []);
        setMenu(Array.isArray(menuData) ? menuData : menuData.data || []);
        setSucursales(Array.isArray(sucData) ? sucData : sucData.data || []);
        setResenas(Array.isArray(resData) ? resData : resData.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const reloadMenu = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchMenu.trim()) params.set("search", searchMenu.trim());
    if (tagMenu.trim()) params.set("tag", tagMenu.trim());
    if (catFilter) params.set("categoria_id", catFilter);

    const res = await fetch(`/api/restaurantes/${id}/menu?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : data.data || []);
    }
  }, [id, searchMenu, tagMenu, catFilter]);

  useEffect(() => {
    if (!loading) reloadMenu();
  }, [catFilter, reloadMenu, loading]);

  const handleMenuSearch = (e) => {
    e.preventDefault();
    reloadMenu();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-background-secondary" />
        <div className="h-48 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error || !restaurante) {
    return (
      <div className="space-y-4">
        <p className="text-accent">{error || "No encontrado"}</p>
        <Link href="/home" className="text-sm text-accent hover:text-accent-dark">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/home" className="text-sm text-accent hover:text-accent-dark">
        ← Volver a restaurantes
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold">{restaurante.nombre}</h2>
        <p className="text-text-secondary">{restaurante.descripcion}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          {restaurante.tipo_cocina && (
            <span className="rounded-full bg-background-secondary px-2.5 py-0.5 font-medium">
              {restaurante.tipo_cocina}
            </span>
          )}
          <span className="text-star">
            ★ {Number(restaurante.calificacion_promedio || 0).toFixed(1)}
          </span>
          <span>{restaurante.total_resenas || 0} reseñas</span>
        </div>
        {restaurante.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {restaurante.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-text-secondary/10 px-2 py-0.5 text-xs text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-text-secondary/10">
        {["menu", "sucursales", "resenas"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "menu" ? "Menú" : t === "sucursales" ? "Sucursales" : "Reseñas"}
          </button>
        ))}
      </div>

      {/* MENU TAB */}
      {tab === "menu" && (
        <div className="space-y-4">
          <form onSubmit={handleMenuSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchMenu}
              onChange={(e) => setSearchMenu(e.target.value)}
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
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filtrar por tag..."
              value={tagMenu}
              onChange={(e) => setTagMenu(e.target.value)}
              onBlur={reloadMenu}
              className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
            />
          </div>

          {menu.length === 0 ? (
            <p className="text-text-secondary">No se encontraron platillos.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menu.map((item) => (
                <div
                  key={item._id}
                  className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-primary">{item.nombre}</p>
                      <p className="text-xs text-text-secondary/60">{item.categoria}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-text-contrast">
                      Q{Number(item.precio).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{item.descripcion}</p>
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-background-primary px-2 py-0.5 text-xs text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUCURSALES TAB */}
      {tab === "sucursales" && (
        <div className="space-y-4">
          {sucursales.length === 0 ? (
            <p className="text-text-secondary">No hay sucursales disponibles.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sucursales.map((s) => (
                <div
                  key={s._id}
                  className="rounded-lg border border-text-secondary/10 bg-background-secondary p-5 space-y-2"
                >
                  <p className="text-lg font-semibold">{s.nombre}</p>
                  <div className="text-sm text-text-secondary space-y-0.5">
                    <p>{s.direccion?.calle}</p>
                    <p>{s.direccion?.zona}, {s.direccion?.ciudad}</p>
                  </div>
                  {s.telefono && <p className="text-sm text-text-secondary">{s.telefono}</p>}
                  <div className="rounded-md bg-background-primary px-3 py-2 text-sm">
                    <span className="font-medium">Horario: </span>
                    <span className="text-text-secondary">
                      {s.horario?.apertura} – {s.horario?.cierre}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESEÑAS TAB */}
      {tab === "resenas" && (
        <div className="space-y-4">
          {resenas.length === 0 ? (
            <p className="text-text-secondary">Aún no hay reseñas.</p>
          ) : (
            <div className="space-y-3">
              {resenas.map((r) => (
                <div
                  key={r._id}
                  className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.usuario || "Cliente"}</span>
                    <Stars count={r.calificacion} />
                  </div>
                  <p className="text-sm text-text-secondary">{r.comentario}</p>
                  <span className="text-xs text-text-secondary/60">{formatDate(r.creado_en)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDER CTA */}
      {tab === "menu" && menu.length > 0 && (
        <div className="rounded-lg bg-background-accent p-6 text-center space-y-3">
          <p className="text-text-contrast font-semibold text-lg">¿Listo para ordenar?</p>
          <Link
            href={`/home/restaurante/${id}/ordenar`}
            className="inline-block rounded-md bg-background-primary px-6 py-2.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-background-secondary"
          >
            Hacer pedido
          </Link>
        </div>
      )}
    </div>
  );
}
