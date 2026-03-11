"use client";

import { useState, useEffect, useCallback } from "react";

function SucursalCard({ sucursal, onViewStaff }) {
  return (
    <div className="rounded-lg border border-text-secondary/20 bg-background-primary p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{sucursal.nombre}</h3>
          <p className="text-xs text-text-secondary mt-1">{sucursal.restaurante}</p>
        </div>
        <button
          onClick={() => onViewStaff(sucursal._id)}
          className="px-3 py-1 text-xs rounded-md bg-accent text-text-contrast hover:bg-accent-dark transition-colors"
        >
          Ver staff
        </button>
      </div>
      <div className="text-xs text-text-secondary space-y-1">
        <p>📍 {sucursal.direccion?.calle || "—"}, {sucursal.direccion?.zona || "—"}</p>
        <p>🕐 {sucursal.horario?.apertura || "—"} – {sucursal.horario?.cierre || "—"}</p>
      </div>
    </div>
  );
}

function StaffModal({ sucursalId, onClose }) {
  const [staff, setStaff] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sucursalId) return;

    setLoading(true);
    fetch(`/api/admin/sucursales/${sucursalId}/staff`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar staff");
        return res.json();
      })
      .then((data) => {
        setSucursal(data.sucursal);
        setStaff(data.staff);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sucursalId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background-secondary rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-background-secondary border-b border-text-secondary/20 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Staff — {sucursal?.nombre}</h2>
            <p className="text-xs text-text-secondary">{sucursal?.restaurante}</p>
          </div>
          <button
            onClick={onClose}
            className="text-lg text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-sm text-text-secondary">Cargando...</p>
          ) : error ? (
            <p className="text-sm text-accent">{error}</p>
          ) : staff?.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin staff asignado.</p>
          ) : (
            <div className="space-y-2">
              {staff?.map((member) => (
                <div
                  key={member._id}
                  className="rounded-md border border-text-secondary/10 bg-background-primary p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{member.nombre}</span>
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">
                        {member.rol === "worker" ? "👨‍🍳 Kitchen" : "🚴 Delivery"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">{member.email}</p>
                  {member.telefono && (
                    <p className="text-xs text-text-secondary">{member.telefono}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  const loadSucursales = useCallback(() => {
    setLoading(true);
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
              allSucursales.push({ ...s, restaurante: r.nombre });
            }
          } catch {
            // ignored
          }
        }

        setSucursales(allSucursales);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSucursales();
  }, [loadSucursales]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-background-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-background-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-accent">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sucursales</h2>
        <p className="text-text-secondary text-sm mt-1">
          {sucursales.length} sucursal{sucursales.length !== 1 && "es"} registrada
          {sucursales.length !== 1 && "s"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sucursales.map((s) => (
          <SucursalCard
            key={s._id}
            sucursal={s}
            onViewStaff={setSelectedSucursal}
          />
        ))}
      </div>

      {selectedSucursal && (
        <StaffModal
          sucursalId={selectedSucursal}
          onClose={() => setSelectedSucursal(null)}
        />
      )}
    </div>
  );
}
