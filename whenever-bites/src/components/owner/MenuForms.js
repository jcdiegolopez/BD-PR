"use client";

import { useState } from "react";

export function BulkUploadForm({ restaurantes, categorias }) {
  const [restId, setRestId] = useState(restaurantes[0]?._id || "");
  const [catId, setCatId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const filteredCats = categorias.filter((c) => c.restaurante_id === restId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    let items;
    try {
      items = JSON.parse(jsonText);
      if (!Array.isArray(items) || items.length === 0) throw new Error();
    } catch {
      setMsg("JSON inválido. Debe ser un arreglo de objetos.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/menuitems/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurante_id: restId,
          categoria_id: catId || undefined,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al insertar");
      setMsg(`${data.insertedCount || data.count || items.length} platillos insertados`);
      setJsonText("");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3">
      <h3 className="font-medium">Carga masiva de platillos</h3>

      <select
        value={restId}
        onChange={(e) => { setRestId(e.target.value); setCatId(""); }}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
      >
        {restaurantes.map((r) => (
          <option key={r._id} value={r._id}>{r.nombre}</option>
        ))}
      </select>

      <select
        value={catId}
        onChange={(e) => setCatId(e.target.value)}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
      >
        <option value="">Categoría por defecto (opcional)</option>
        {filteredCats.map((c) => (
          <option key={c._id} value={c._id}>{c.nombre}</option>
        ))}
      </select>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={6}
        placeholder={`[{"nombre":"Hamburguesa","descripcion":"Clásica","precio":35,"tags":["popular"]}]`}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm font-mono placeholder:text-text-secondary/60 resize-none"
      />
      <p className="text-xs text-text-secondary">
        Cada objeto: nombre, descripcion, precio, tags[], categoria_id (opcional), opciones_personalizacion[]
      </p>

      {msg && <p className="text-sm text-accent">{msg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
      >
        {submitting ? "Insertando..." : "Insertar platillos"}
      </button>
    </form>
  );
}

export function PrecioAdjustForm({ restaurantes, categorias }) {
  const [restId, setRestId] = useState(restaurantes[0]?._id || "");
  const [catId, setCatId] = useState("");
  const [tipo, setTipo] = useState("aumento");
  const [porcentaje, setPorcentaje] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const filteredCats = categorias.filter((c) => c.restaurante_id === restId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const pct = Number(porcentaje);
    if (!pct || pct <= 0 || pct > 100) {
      setMsg("Porcentaje debe estar entre 1 y 100");
      return;
    }

    if (!catId) {
      setMsg("Selecciona una categoría");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/menuitems/precio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurante_id: restId,
          categoria_id: catId,
          tipo,
          porcentaje: pct,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al ajustar precios");
      setMsg(`${data.modifiedCount} platillos actualizados`);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3">
      <h3 className="font-medium">Ajuste masivo de precios</h3>

      <select
        value={restId}
        onChange={(e) => { setRestId(e.target.value); setCatId(""); }}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
      >
        {restaurantes.map((r) => (
          <option key={r._id} value={r._id}>{r.nombre}</option>
        ))}
      </select>

      <select
        value={catId}
        onChange={(e) => setCatId(e.target.value)}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
      >
        <option value="">Seleccionar categoría</option>
        {filteredCats.map((c) => (
          <option key={c._id} value={c._id}>{c.nombre}</option>
        ))}
      </select>

      <div className="flex gap-3">
        {["aumento", "oferta"].map((t) => (
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
            {t === "aumento" ? "📈 Aumento" : "🏷️ Oferta"}
          </button>
        ))}
      </div>

      <input
        type="number"
        min="1"
        max="100"
        placeholder="Porcentaje (%)"
        value={porcentaje}
        onChange={(e) => setPorcentaje(e.target.value)}
        className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
      />

      <p className="text-xs text-text-secondary">
        {tipo === "aumento"
          ? `Los precios se multiplicarán por ${((1 + (Number(porcentaje) || 0) / 100)).toFixed(2)}`
          : `Los precios se multiplicarán por ${((1 - (Number(porcentaje) || 0) / 100)).toFixed(2)}`}
      </p>

      {msg && <p className="text-sm text-accent">{msg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
      >
        {submitting ? "Aplicando..." : "Aplicar ajuste"}
      </button>
    </form>
  );
}
