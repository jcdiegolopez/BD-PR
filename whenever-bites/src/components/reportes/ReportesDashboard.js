"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const CHART_COLORS = ["#D62B42", "#FF6B6B", "#FFA07A", "#FFB347", "#FFC67D"];

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
  const [user, setUser] = useState(null);
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState("");

  // Cargar usuario y restaurantes al montar
  useEffect(() => {
    const loadUserAndRestaurantes = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("No se pudo cargar usuario");
        const userData = await userRes.json();
        setUser(userData.user);

        const restRes = await fetch("/api/restaurantes/mis-restaurantes");
        if (!restRes.ok) throw new Error("No se pudieron cargar restaurantes");
        const restData = await restRes.json();
        setRestaurantes(restData.data);

        // Si es owner, seleccionar automáticamente su restaurante
        if (userData.user.rol === "owner" && restData.data.length > 0) {
          setRestauranteSeleccionado(restData.data[0]._id);
        }
      } catch (err) {
        console.error("Error cargando usuario:", err);
      }
    };

    loadUserAndRestaurantes();
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (restauranteSeleccionado) params.set("restaurante_id", restauranteSeleccionado);
    return params.toString();
  }, [desde, hasta, restauranteSeleccionado]);

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
        <h2 className="text-2xl font-semibold">Reportes analíticos</h2>
        <p className="mt-1 text-sm text-text-secondary">
          R1 ventas, R2 platillos, R3 tiempos y R4 calificaciones con gráficas visuales.
        </p>
      </div>

      <div className="rounded-lg border border-text-secondary/10 bg-background-primary p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

          {user?.rol === "admin" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Restaurante</label>
              <select
                value={restauranteSeleccionado}
                onChange={(e) => setRestauranteSeleccionado(e.target.value)}
                className="w-full rounded-md border border-text-secondary/20 bg-background-secondary px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {restaurantes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2">
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
          title="Promedio calificación"
          value={summary.promedioCalif ? summary.promedioCalif.toFixed(2) : "—"}
        />
      </div>

      {/* R1 Ventas */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">R1 Ventas por restaurante</h3>
        {ventas.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="restaurante" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="ventas_brutas" fill="#D62B42" name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-text-secondary/10 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left">Restaurante</th>
                    <th className="px-3 py-2 text-right">Órdenes</th>
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
          </div>
        )}
      </section>

      {/* R2 Platillos */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">R2 Top platillos más vendidos</h3>
        {platillos.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={platillos.slice(0, 10)} 
                  layout="vertical"
                  margin={{ left: 150 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Bar dataKey="unidades_vendidas" fill="#FF6B6B" name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {platillos.slice(0, 5).map((row) => (
                <div
                  key={`${row.restaurante_id}-${row.menuitem_id}`}
                  className="rounded-lg border border-text-secondary/10 bg-background-secondary p-3"
                >
                  <p className="font-medium">{row.nombre}</p>
                  <p className="text-xs text-text-secondary">{row.restaurante}</p>
                  <div className="mt-2 flex justify-between">
                    <p className="text-sm">Unidades: {formatNumber(row.unidades_vendidas)}</p>
                    <p className="text-sm font-semibold text-accent">{formatCurrency(row.monto_vendido)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* R3 Tiempos */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">R3 Tiempos por estado y sucursal</h3>
        {tiempos.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tiempos.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="promedio_minutos" stroke="#D62B42" name="Promedio (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-text-secondary/10 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left">Sucursal</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-right">Transiciones</th>
                    <th className="px-3 py-2 text-right">Promedio (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {tiempos.map((row) => (
                    <tr key={`${row.sucursal_id}-${row.estado}`} className="border-t border-text-secondary/10">
                      <td className="px-3 py-2">{row.sucursal}</td>
                      <td className="px-3 py-2">{row.estado}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(row.transiciones)}</td>
                      <td className="px-3 py-2 text-right font-medium">{Number(row.promedio_minutos).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* R4 Calificaciones */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">R4 Calificaciones por restaurante</h3>
        {calificaciones.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin datos.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-text-secondary/10 bg-background-secondary p-4">
              {calificaciones.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={calificaciones}
                      dataKey="total_resenas"
                      nameKey="restaurante"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {calificaciones.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-text-secondary/10 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left">Restaurante</th>
                    <th className="px-3 py-2 text-right">Reseñas</th>
                    <th className="px-3 py-2 text-right">Promedio</th>
                    <th className="px-3 py-2 text-left">Distribución</th>
                  </tr>
                </thead>
                <tbody>
                  {calificaciones.map((row) => (
                    <tr key={row.restaurante_id} className="border-t border-text-secondary/10">
                      <td className="px-3 py-2">{row.restaurante}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(row.total_resenas)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-accent">{Number(row.calificacion_promedio).toFixed(2)} ⭐</td>
                      <td className="px-3 py-2 text-xs text-text-secondary">
                        1⭐:{row.distribucion["1"]} 2⭐:{row.distribucion["2"]} 3⭐:{row.distribucion["3"]} 4⭐:{row.distribucion["4"]} 5⭐:{row.distribucion["5"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
