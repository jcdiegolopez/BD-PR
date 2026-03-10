"use client";

import { useEffect, useState } from "react";
import { BulkUploadForm, PrecioAdjustForm } from "@/components/owner/MenuForms";
export default function MenuPage() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/owner/menu")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar menu");
        return res.json();
      })
      .then((payload) => {
        setRestaurantes(payload.restaurantes || []);
        setCategorias(payload.categorias || []);
        setItems(payload.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-background-secondary" />
        <div className="h-96 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Gestión de menú</h2>
        <p className="text-text-secondary">
          Categorías y platillos de tus restaurantes.
        </p>
      </div>

      {restaurantes.length === 0 && (
        <p className="text-text-secondary">No tienes restaurantes registrados.</p>
      )}

      {restaurantes.map((rest) => {
        const restCats = categorias.filter(
          (c) => String(c.restaurante_id) === String(rest._id)
        );

        return (
          <div key={String(rest._id)} className="space-y-6">
            <h3 className="text-xl font-semibold">{rest.nombre}</h3>

            {restCats.length === 0 && (
              <p className="text-sm text-text-secondary">Sin categorías.</p>
            )}

            {restCats.map((cat) => {
              const catItems = items.filter(
                (it) => String(it.categoria_id) === String(cat._id)
              );

              return (
                <div key={String(cat._id)} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium">{cat.nombre}</h4>
                    <span className="text-xs text-text-secondary">
                      {cat.descripcion}
                    </span>
                  </div>

                  {catItems.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Sin platillos en esta categoría.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {catItems.map((item) => (
                        <div
                          key={String(item._id)}
                          className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-text-primary">
                              {item.nombre}
                            </p>
                            <span className="shrink-0 rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-text-contrast">
                              Q{item.precio?.toString()}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {item.descripcion}
                          </p>
                          {item.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-background-primary px-2 py-0.5 text-xs text-text-secondary"
                                >
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
              );
            })}
          </div>
        );
      })}

      {/* Bulk upload and price adjustment forms */}
      {restaurantes.length > 0 && (
        <div className="space-y-6 border-t border-text-secondary/10 pt-8">
          <h3 className="text-xl font-semibold">Herramientas</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <BulkUploadForm restaurantes={restaurantes} categorias={categorias} />
            <PrecioAdjustForm restaurantes={restaurantes} categorias={categorias} />
          </div>
        </div>
      )}
    </div>
  );
}
