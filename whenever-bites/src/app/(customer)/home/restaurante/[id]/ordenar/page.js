"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function OrdenarPage() {
  const { id } = useParams();
  const router = useRouter();

  const [restaurante, setRestaurante] = useState(null);
  const [menu, setMenu] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Order state
  const [cart, setCart] = useState({});
  const [tipo, setTipo] = useState("pickup");
  const [sucursalId, setSucursalId] = useState("");
  const [direccionTexto, setDireccionTexto] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [nearestBranch, setNearestBranch] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [restRes, menuRes, sucRes] = await Promise.all([
          fetch(`/api/restaurantes/${id}`),
          fetch(`/api/restaurantes/${id}/menu`),
          fetch(`/api/restaurantes/${id}/sucursales`),
        ]);

        if (!restRes.ok) throw new Error("Restaurante no encontrado");

        setRestaurante(await restRes.json());

        const menuData = menuRes.ok ? await menuRes.json() : [];
        setMenu(Array.isArray(menuData) ? menuData : menuData.data || []);

        const sucData = sucRes.ok ? await sucRes.json() : [];
        const sucList = Array.isArray(sucData) ? sucData : sucData.data || [];
        setSucursales(sucList);
        if (sucList.length > 0) setSucursalId(sucList[0]._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLng = pos.coords.longitude;
        const newLat = pos.coords.latitude;
        setLng(String(newLng));
        setLat(String(newLat));

        try {
          const res = await fetch(
            `/api/sucursales/cercana?lng=${newLng}&lat=${newLat}&restaurante_id=${id}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?._id) {
              setSucursalId(data._id);
              setNearestBranch(data);
            }
          }
        } catch { /* ignored */ }
      },
      () => {}
    );
  };

  useEffect(() => {
    if (tipo === "delivery") detectLocation();
  }, [tipo]);

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
                  className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4 flex items-center justify-between gap-3"
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
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-text-secondary/20 text-sm hover:bg-background-primary"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{cart[item._id] || 0}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item._id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-text-secondary/20 text-sm hover:bg-background-primary"
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
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  tipo === t
                    ? "bg-accent text-text-contrast"
                    : "bg-background-secondary text-text-primary hover:bg-background-secondary/80"
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
            <p className="text-sm text-text-secondary">
              Se detectó la más cercana: <span className="font-medium text-text-primary">{nearestBranch.nombre}</span>
            </p>
          )}
          <select
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
          >
            {sucursales.map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre} — {s.direccion?.calle}, {s.direccion?.zona}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery address */}
        {tipo === "delivery" && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Dirección de entrega</h3>
            <input
              type="text"
              placeholder="Dirección completa"
              value={direccionTexto}
              onChange={(e) => setDireccionTexto(e.target.value)}
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
            </div>
            <p className="text-xs text-text-secondary">
              Las coordenadas se detectan automáticamente. También puedes ingresarlas manualmente.
            </p>
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
          <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-2">
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
