"use client";

import { useState, useEffect, useCallback } from "react";
import UsuariosTable from "@/components/usuarios/UsuariosTable";

const ROLES = ["admin", "owner", "worker", "repartidor", "customer"];

function CreateUserForm({ onCreated }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("customer");
  const [telefono, setTelefono] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const needsSucursal = ["worker", "repartidor"].includes(rol);

  useEffect(() => {
    if (needsSucursal && sucursales.length === 0) {
      fetch("/api/restaurantes")
        .then((res) => res.json())
        .then(async (rests) => {
          const allSucursales = [];
          const restList = Array.isArray(rests) ? rests : rests.data || [];
          for (const r of restList) {
            try {
              const res = await fetch(`/api/restaurantes/${r._id}/sucursales`);
              const sData = await res.json();
              const sList = Array.isArray(sData) ? sData : sData.data || [];
              for (const s of sList) {
                allSucursales.push({ ...s, restNombre: r.nombre });
              }
            } catch { /* ignored */ }
          }
          setSucursales(allSucursales);
          if (allSucursales.length > 0) setSucursalId(allSucursales[0]._id);
        })
        .catch(() => {});
    }
  }, [needsSucursal, sucursales.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);

    try {
      const body = {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        rol,
        telefono: telefono.trim() || undefined,
      };
      if (needsSucursal) body.sucursal_asignada = sucursalId;

      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear usuario");

      setMsg(`Usuario "${data.nombre}" creado`);
      setNombre("");
      setEmail("");
      setPassword("");
      setTelefono("");
      onCreated?.();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark"
      >
        + Nuevo usuario
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-text-secondary/10 bg-background-primary p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Crear usuario</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-secondary hover:text-text-primary">
          Cerrar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Teléfono (opcional)"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm placeholder:text-text-secondary/60"
        />
        {needsSucursal && (
          <select
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            className="rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
          >
            {sucursales.map((s) => (
              <option key={s._id} value={s._id}>
                {s.restNombre} — {s.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {msg && <p className="text-sm text-accent">{msg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-accent-dark disabled:opacity-50"
      >
        {submitting ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsuarios = useCallback(() => {
    setLoading(true);
    fetch("/api/usuarios")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json();
      })
      .then(setUsuarios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de usuarios</h2>
          <p className="text-text-secondary text-sm mt-1">
            {usuarios.length} usuario{usuarios.length !== 1 && "s"} registrado
            {usuarios.length !== 1 && "s"} — haz clic en una fila para ver
            detalles
          </p>
        </div>
        <CreateUserForm onCreated={loadUsuarios} />
      </div>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
