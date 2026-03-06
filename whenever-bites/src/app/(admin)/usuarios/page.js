"use client";

import { useState, useEffect } from "react";
import UsuariosTable from "@/components/usuarios/UsuariosTable";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/usuarios")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json();
      })
      .then(setUsuarios)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Gestión de usuarios</h2>
        <p className="text-text-secondary text-sm mt-1">
          {usuarios.length} usuario{usuarios.length !== 1 && "s"} registrado
          {usuarios.length !== 1 && "s"} — haz clic en una fila para ver
          detalles
        </p>
      </div>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
