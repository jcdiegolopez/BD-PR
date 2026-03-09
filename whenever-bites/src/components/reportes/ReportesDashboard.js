"use client";

import { useMemo, useState } from "react";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return `Q${Number(value || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-GT");
}

function ReportCard({ title, value, subtitle }) {
  return (
    <div className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4">
      <p className="text-xs uppercase tracking-wide text-text-secondary">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-text-secondary">{subtitle}</p> : null}
    </div>
  );
}

export default function ReportesDashboard() {
  const defaultUntil = toDateInputValue(new Date());
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);
  const defaultFrom = toDateInputValue(defaultFromDate);

  const [desde, setDesde] = useState(defaultFrom);
  const [hasta, setHasta] = useState(defaultUntil);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ventas, setVentas] = useState([]);
  const [platillos, setPlatillos] = useState([]);
  const [tiempos, setTiempos] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return params.toString();
  }, [desde, hasta]);

  const summary = useMemo(() => {
    const ventasTotales = ventas.reduce((acc, row) => {
      return acc + Number(row.ventas_brutas || 0);
    }, 0);

    const ordenesTotales = ventas.reduce((acc, row) => {
      return acc + Number(row.total_ordenes || 0);
    }, 0);

    const unidadesVendidas = platillos.reduce((acc, row) => {
      return acc + Number(row.unidades_vendidas || 0);
    }, 0);

    const promedioTiempo = tiempos.length
      ? tiempos.reduce((acc, row) => acc + Number(row.promedio_minutos || 0), 0) /
        tiempos.length
      : 0;

    const promedioCalif = calificaciones.length
      ? calificaciones.reduce(
          (acc, row) => acc + Number(row.calificacion_promedio || 0),
          0,
        ) / calificaciones.length
      : 0;

    return {
      ventasTotales,
      ordenesTotales,
      unidadesVendidas,
      promedioTiempo,
      promedioCalif,
    };
  }, [ventas, platillos, tiempos, calificaciones]);

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        `/api/reportes/ventas?${queryString}`,
        `/api/reportes/platillos?${queryString}`,
        `/api/reportes/tiempos?${queryString}`,
        `/api/reportes/calificaciones?${queryString}`,
      ];

      const responses = await Promise.all(endpoints.map((url) => fetch(url)));

      const payloads = await Promise.all(
        responses.map(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || "No se pudieron cargar reportes");
          }
          return data;
        }),
      );

      setVentas(payloads[0].data || []);
      setPlatillos(payloads[1].data || []);
      setTiempos(payloads[2].data || []);
      setCalificaciones(payloads[3].data || []);
    } catch (err) {
      setError(err.message || "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Reportes analiticos</h2>
        <p className="mt-1 text-sm text-text-secondary">
          R1 ventas, R2 platillos, R3 tiempos y R4 calificaciones.
        </p>
      </div>

      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Cargando..." : "Generar reportes"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ReportCard title="Ventas" value={formatCurrency(summary.ventasTotales)} />
        <ReportCard title="Ordenes" value={formatNumber(summary.ordenesTotales)} />
        <ReportCard title="Unidades vendidas" value={formatNumber(summary.unidadesVendidas)} />
        <ReportCard
          title="Promedio tiempos"
          value={`${summary.promedioTiempo.toFixed(1)} min`}
        />
        <ReportCard
          title="Promedio calificacion"
          value={summary.promedioCalif ? summary.promedioCalif.toFixed(2) : "—"}
        />
      </div>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">R1 Ventas por restaurante</h3>
        {ventas.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="rounded-lg border border-text-secondary/10 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-3 py-2 text-left">Restaurante</th>
                  <th className="px-3 py-2 text-right">Ordenes</th>
                  <th className="px-3 py-2 text-right">Ventas</th>
                  <th className="px-3 py-2 text-right">Ticket promedio</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((row) => (
                  <tr key={row.restaurante_id} className="border-t border-text-secondary/10">
                    <td className="px-3 py-2">{row.restaurante}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.total_ordenes)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.ventas_brutas)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.ticket_promedio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">R2 Top platillos</h3>
        {platillos.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platillos.map((row) => (
              <div
                key={`${row.restaurante_id}-${row.menuitem_id}`}
                className="rounded-lg border border-text-secondary/10 bg-background-secondary p-3"
              >
                <p className="font-medium">{row.nombre}</p>
                <p className="text-xs text-text-secondary">{row.restaurante}</p>
                <p className="mt-2 text-sm">Unidades: {formatNumber(row.unidades_vendidas)}</p>
                <p className="text-sm">Monto: {formatCurrency(row.monto_vendido)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">R3 Tiempos por estado y sucursal</h3>
        {tiempos.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="rounded-lg border border-text-secondary/10 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-3 py-2 text-left">Restaurante</th>
                  <th className="px-3 py-2 text-left">Sucursal</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-right">Transiciones</th>
                  <th className="px-3 py-2 text-right">Promedio min</th>
                </tr>
              </thead>
              <tbody>
                {tiempos.map((row) => (
                  <tr key={`${row.sucursal_id}-${row.estado}`} className="border-t border-text-secondary/10">
                    <td className="px-3 py-2">{row.restaurante}</td>
                    <td className="px-3 py-2">{row.sucursal}</td>
                    <td className="px-3 py-2">{row.estado}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.transiciones)}</td>
                    <td className="px-3 py-2 text-right">{Number(row.promedio_minutos).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">R4 Calificaciones por restaurante</h3>
        {calificaciones.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="rounded-lg border border-text-secondary/10 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-3 py-2 text-left">Restaurante</th>
                  <th className="px-3 py-2 text-right">Resenas</th>
                  <th className="px-3 py-2 text-right">Promedio</th>
                  <th className="px-3 py-2 text-left">Distribucion</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.map((row) => (
                  <tr key={row.restaurante_id} className="border-t border-text-secondary/10">
                    <td className="px-3 py-2">{row.restaurante}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.total_resenas)}</td>
                    <td className="px-3 py-2 text-right">{Number(row.calificacion_promedio).toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      1:{row.distribucion["1"]} 2:{row.distribucion["2"]} 3:{row.distribucion["3"]} 4:{row.distribucion["4"]} 5:{row.distribucion["5"]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
