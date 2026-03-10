"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function OrdenarPage() {
  const { id } = useParams();
  const router = useRouter();

  const [restaurante, setRestaurante] = useState(null);
  const [menu, setMenu] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Order state
  const [cart, setCart] = useState({});
  const [tipo, setTipo] = useState("pickup");
  const [sucursalId, setSucursalId] = useState("");
  const [selectedAddressAlias, setSelectedAddressAlias] = useState("");
  const [direccionTexto, setDireccionTexto] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [nearestBranch, setNearestBranch] = useState(null);
  const [savedAddressError, setSavedAddressError] = useState("");

  const loadNearestBranch = useCallback(async (longitude, latitude) => {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      setNearestBranch(null);
      return null;
    }

    try {
      const res = await fetch(
        `/api/sucursales/cercana?lng=${longitude}&lat=${latitude}&restaurante_id=${id}`
      );

      if (!res.ok) throw new Error("No se encontró una sucursal cercana");

      const data = await res.json();
      if (data?._id) {
        setSucursalId(data._id);
        setNearestBranch(data);
        return data;
      }
    } catch {
      setNearestBranch(null);
    }

    return null;
  }, [id]);

  const handleSavedAddressSelect = useCallback((direccion) => {
    setSelectedAddressAlias(direccion.alias);
    setDireccionTexto(direccion.texto || "");

    const coordinates = direccion.ubicacion?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      setLng(String(coordinates[0]));
      setLat(String(coordinates[1]));
      return;
    }

    setLng("");
    setLat("");
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [restRes, menuRes, sucRes, dirRes] = await Promise.all([
          fetch(`/api/restaurantes/${id}`),
          fetch(`/api/restaurantes/${id}/menu`),
          fetch(`/api/restaurantes/${id}/sucursales`),
          fetch("/api/customer/direcciones"),
        ]);

        if (!restRes.ok) throw new Error("Restaurante no encontrado");

        setRestaurante(await restRes.json());

        const menuData = menuRes.ok ? await menuRes.json() : [];
        setMenu(Array.isArray(menuData) ? menuData : menuData.data || []);

        const sucData = sucRes.ok ? await sucRes.json() : [];
        const sucList = Array.isArray(sucData) ? sucData : sucData.data || [];
        setSucursales(sucList);
        if (sucList.length > 0) setSucursalId(sucList[0]._id);

        if (dirRes.ok) {
          const dirData = await dirRes.json();
          const dirList = Array.isArray(dirData) ? dirData : [];
          setDirecciones(dirList);

          const preferredAddress = dirList.find((direccion) => direccion.predeterminada) || dirList[0];
          if (preferredAddress) {
            handleSavedAddressSelect(preferredAddress);
          }
        } else {
          setSavedAddressError("No se pudieron cargar tus direcciones guardadas.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [handleSavedAddressSelect, id]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedAddressAlias("");
        setLng(String(pos.coords.longitude));
        setLat(String(pos.coords.latitude));
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (tipo !== "delivery") return;

    if (lng && lat) {
      void loadNearestBranch(Number(lng), Number(lat));
      return;
    }

    detectLocation();
  }, [detectLocation, lat, lng, loadNearestBranch, tipo]);

  const updateQty = (itemId, delta) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartItems = Object.entries(cart)
    .map(([itemId, qty]) => {
      const item = menu.find((m) => m._id === itemId);
      return item ? { ...item, cantidad: qty } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.precio) * item.cantidad,
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setSubmitError("Agrega al menos un platillo");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const body = {
      restaurante_id: id,
      sucursal_id: sucursalId,
      tipo,
      items: cartItems.map((item) => ({
        menuitem_id: item._id,
        cantidad: item.cantidad,
      })),
      notas: notas.trim() || undefined,
    };

    if (tipo === "delivery") {
      if (!direccionTexto.trim() || !lng || !lat) {
        setSubmitError("Completa la dirección de entrega");
        setSubmitting(false);
        return;
      }
      body.direccion_entrega = {
        texto: direccionTexto.trim(),
        ubicacion: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
      };
    }

    try {
      const res = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la orden");

      router.push("/mis-ordenes");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-background-secondary" />
        <div className="h-96 animate-pulse rounded-lg bg-background-secondary" />
      </div>
    );
  }

  if (error || !restaurante) {
    return (
      <div className="space-y-4">
        <p className="text-accent">{error || "No encontrado"}</p>
        <Link href="/home" className="text-sm text-accent hover:text-accent-dark">← Volver</Link>
      </div>
    );
  }

  const nearestDistance = formatDistance(nearestBranch?.distancia_metros);

  return (
    <div className="space-y-6">
      <Link href={`/home/restaurante/${id}`} className="text-sm text-accent hover:text-accent-dark">
        ← Volver a {restaurante.nombre}
      </Link>

      <div>
        <h2 className="text-2xl font-semibold">Ordenar de {restaurante.nombre}</h2>
        <p className="text-text-secondary text-sm mt-1">Selecciona platillos y configura tu orden</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Menu items */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Platillos</h3>
          {menu.length === 0 ? (
            <p className="text-text-secondary">No hay platillos disponibles.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {menu.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-text-secondary/10 bg-background-primary p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{item.nombre}</p>
                    <p className="text-xs text-text-secondary truncate">{item.descripcion}</p>
                    <p className="text-sm font-medium text-accent mt-0.5">Q{Number(item.precio).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item._id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 text-sm text-accent transition-colors duration-200 hover:bg-accent hover:text-text-contrast"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{cart[item._id] || 0}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item._id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 text-sm text-accent transition-colors duration-200 hover:bg-accent hover:text-text-contrast"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order type */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Tipo de orden</h3>
          <div className="flex gap-3">
            {["pickup", "delivery"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  tipo === t
                    ? "bg-accent text-text-contrast shadow-[0_12px_24px_-16px_rgba(214,43,66,0.85)]"
                    : "bg-background-primary text-text-primary hover:bg-background-secondary"
                }`}
              >
                {t === "pickup" ? "🏪 Pickup" : "🛵 Delivery"}
              </button>
            ))}
          </div>
        </div>

        {/* Branch selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">
            {tipo === "delivery" ? "Sucursal más cercana" : "Elegir sucursal"}
          </h3>
          {nearestBranch && tipo === "delivery" && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    Recomendación para delivery
                  </p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">{nearestBranch.nombre}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {nearestDistance
                      ? `Está aproximadamente a ${nearestDistance} de la dirección seleccionada.`
                      : "Se asignó automáticamente según tu ubicación."}
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-text-contrast">
                  Más cercana
                </span>
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {sucursales.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setSucursalId(s._id)}
                className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
                  sucursalId === s._id
                    ? "border-accent bg-accent text-text-contrast shadow-[0_14px_28px_-20px_rgba(214,43,66,0.9)]"
                    : nearestBranch?._id === s._id
                      ? "border-accent/30 bg-accent/5 hover:border-accent"
                      : "border-text-secondary/10 bg-background-primary hover:border-accent/25 hover:bg-background-secondary"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-semibold ${sucursalId === s._id ? "text-text-contrast" : "text-text-primary"}`}>
                    {s.nombre}
                  </p>
                  {nearestBranch?._id === s._id && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      sucursalId === s._id
                        ? "bg-white/15 text-text-contrast"
                        : "bg-accent/10 text-accent"
                    }`}>
                      Más cercana
                    </span>
                  )}
                  {sucursalId === s._id && (
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-text-contrast">
                      {tipo === "delivery" ? "Asignada" : "Seleccionada"}
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${sucursalId === s._id ? "text-text-contrast/85" : "text-text-secondary"}`}>
                  {s.direccion?.calle}, {s.direccion?.zona}
                </p>
                <div className={`mt-3 flex flex-wrap gap-2 text-xs ${sucursalId === s._id ? "text-text-contrast/80" : "text-text-secondary"}`}>
                  {s.telefono && <span>{s.telefono}</span>}
                  {nearestBranch?._id === s._id && nearestDistance && <span>{nearestDistance}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        {tipo === "delivery" && (
          <div className="space-y-4 rounded-2xl border border-text-secondary/10 bg-background-primary p-5 shadow-sm">
            <h3 className="text-lg font-medium">Dirección de entrega</h3>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Usa una guardada o ajusta una dirección manual antes de confirmar.
              </p>
              <Link href="/mis-direcciones" className="text-sm font-medium text-accent hover:text-accent-dark">
                Administrar direcciones
              </Link>
            </div>

            {direcciones.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {direcciones.map((direccion) => {
                  const isSelected = selectedAddressAlias === direccion.alias;

                  return (
                    <button
                      key={direccion.alias}
                      type="button"
                      onClick={() => handleSavedAddressSelect(direccion)}
                      className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
                        isSelected
                          ? "border-accent bg-accent text-text-contrast shadow-[0_14px_28px_-20px_rgba(214,43,66,0.9)]"
                          : "border-text-secondary/10 bg-background-secondary hover:border-accent/20 hover:bg-background-primary"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold ${isSelected ? "text-text-contrast" : "text-text-primary"}`}>
                          {direccion.alias}
                        </p>
                        {direccion.predeterminada && (
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isSelected ? "bg-white/15 text-text-contrast" : "bg-accent/10 text-accent"
                          }`}>
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-sm ${isSelected ? "text-text-contrast/85" : "text-text-secondary"}`}>
                        {direccion.texto}
                      </p>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressAlias("");
                    setDireccionTexto("");
                    setLng("");
                    setLat("");
                    setNearestBranch(null);
                  }}
                  className={`rounded-2xl border border-dashed p-4 text-left transition-colors duration-200 ${
                    !selectedAddressAlias
                      ? "border-accent bg-accent/5"
                      : "border-text-secondary/20 bg-background-primary hover:border-accent/25"
                  }`}
                >
                  <p className="font-semibold text-text-primary">Escribir otra dirección</p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Usa una ubicación nueva sin reemplazar tus direcciones guardadas.
                  </p>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-text-secondary/20 bg-background-secondary px-4 py-3 text-sm text-text-secondary">
                No tienes direcciones guardadas todavía. Puedes crear una en Mis direcciones o escribir una abajo.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="text"
                placeholder="Dirección completa"
                value={direccionTexto}
                onChange={(e) => {
                  setSelectedAddressAlias("");
                  setDireccionTexto(e.target.value);
                }}
                className="w-full rounded-xl border border-text-secondary/20 bg-background-secondary px-3 py-2.5 text-sm placeholder:text-text-secondary/60"
              />
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark"
              >
                Usar mi ubicación
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                placeholder="Longitud"
                value={lng}
                onChange={(e) => {
                  setSelectedAddressAlias("");
                  setLng(e.target.value);
                }}
                className="flex-1 rounded-xl border border-text-secondary/20 bg-background-secondary px-3 py-2.5 text-sm placeholder:text-text-secondary/60"
              />
              <input
                type="number"
                step="any"
                placeholder="Latitud"
                value={lat}
                onChange={(e) => {
                  setSelectedAddressAlias("");
                  setLat(e.target.value);
                }}
                className="flex-1 rounded-xl border border-text-secondary/20 bg-background-secondary px-3 py-2.5 text-sm placeholder:text-text-secondary/60"
              />
            </div>
            <p className="text-xs text-text-secondary">
              Si eliges una dirección guardada, puedes ajustarla aquí antes de confirmar. La sucursal recomendada se recalcula con estas coordenadas.
            </p>
            {savedAddressError && <p className="text-sm text-accent">{savedAddressError}</p>}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Instrucciones especiales..."
            className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60 resize-none"
          />
        </div>

        {/* Cart summary */}
        {cartItems.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-text-secondary/10 bg-background-primary p-4 shadow-sm">
            <h3 className="font-medium">Resumen</h3>
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between text-sm text-text-secondary">
                <span>{item.cantidad}× {item.nombre}</span>
                <span>Q{(Number(item.precio) * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-text-secondary/10 pt-2 mt-2">
              <span>Total</span>
              <span>Q{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {submitError && <p className="text-sm text-accent">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting || cartItems.length === 0}
          className="w-full rounded-md bg-accent py-3 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
        >
          {submitting ? "Procesando..." : `Confirmar orden — Q${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
