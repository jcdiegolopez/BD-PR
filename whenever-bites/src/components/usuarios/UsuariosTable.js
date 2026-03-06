"use client";

import { useState } from "react";
import RolBadge from "@/components/ui/RolBadge";

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(v) {
  return `Q${Number(v).toFixed(2)}`;
}

/* ── Detalle por rol ─────────────────────────────────────── */

function CustomerDetail({ data }) {
  const { ordenes, resenas } = data;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Órdenes recientes */}
      <div>
        <h4 className="text-sm font-semibold mb-2">
          Pedidos ({ordenes.total})
        </h4>
        {ordenes.recientes.length === 0 ? (
          <p className="text-xs text-text-secondary">Sin pedidos aún.</p>
        ) : (
          <ul className="space-y-2">
            {ordenes.recientes.map((o) => (
              <li
                key={o._id}
                className="rounded-md border border-text-secondary/10 bg-background-primary p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.restaurante}</span>
                  <span className="text-text-secondary">
                    {formatDate(o.creado_en)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>{o.tipo === "delivery" ? "Delivery" : "Pickup"}</span>
                  <span className="font-medium">{formatMoney(o.monto_total)}</span>
                </div>
                <EstadoBadge estado={o.estado_actual} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reseñas */}
      <div>
        <h4 className="text-sm font-semibold mb-2">
          Reseñas ({resenas.total})
        </h4>
        {resenas.lista.length === 0 ? (
          <p className="text-xs text-text-secondary">Sin reseñas aún.</p>
        ) : (
          <ul className="space-y-2">
            {resenas.lista.map((r) => (
              <li
                key={r._id}
                className="rounded-md border border-text-secondary/10 bg-background-primary p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.restaurante}</span>
                  <Stars count={r.calificacion} />
                </div>
                <p className="mt-1 text-text-secondary">{r.comentario}</p>
                <span className="mt-1 block text-text-secondary/60">
                  {formatDate(r.creado_en)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OwnerDetail({ data }) {
  const { restaurantes } = data;
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">
        Restaurantes ({restaurantes.length})
      </h4>
      {restaurantes.length === 0 ? (
        <p className="text-xs text-text-secondary">Sin restaurantes.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {restaurantes.map((r) => (
            <div
              key={r._id}
              className="rounded-md border border-text-secondary/10 bg-background-primary p-3 text-xs"
            >
              <p className="font-medium text-sm">{r.nombre}</p>
              <p className="text-text-secondary mt-0.5">{r.descripcion}</p>
              <div className="mt-2 flex items-center gap-3 text-text-secondary">
                <span>
                  {Number(r.calificacion_promedio).toFixed(1)} ★
                </span>
                <span>{r.total_resenas} reseñas</span>
                <span>{r.total_ordenes} pedidos</span>
              </div>
              {r.sucursales.length > 0 && (
                <div className="mt-2 border-t border-text-secondary/10 pt-2">
                  <p className="font-medium mb-1">Sucursales:</p>
                  {r.sucursales.map((s) => (
                    <p key={s._id} className="text-text-secondary">
                      {s.nombre} — {s.direccion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerDetail({ data }) {
  const { sucursal, ordenes_atendidas } = data;
  return (
    <div className="space-y-2 text-xs">
      <div>
        <h4 className="text-sm font-semibold mb-1">Sucursal asignada</h4>
        {sucursal ? (
          <div className="rounded-md border border-text-secondary/10 bg-background-primary p-3">
            <p className="font-medium text-sm">
              {sucursal.restaurante} — {sucursal.nombre}
            </p>
            <p className="text-text-secondary">{sucursal.direccion}</p>
            <p className="text-text-secondary mt-1">
              Horario: {sucursal.horario}
            </p>
          </div>
        ) : (
          <p className="text-text-secondary">Sin sucursal asignada.</p>
        )}
      </div>
      <p className="text-text-secondary">
        Órdenes atendidas en la sucursal:{" "}
        <span className="font-medium text-text-primary">
          {ordenes_atendidas}
        </span>
      </p>
    </div>
  );
}

function RepartidorDetail({ data }) {
  const { sucursal, entregas } = data;
  return (
    <div className="space-y-2 text-xs">
      <div>
        <h4 className="text-sm font-semibold mb-1">Sucursal asignada</h4>
        {sucursal ? (
          <div className="rounded-md border border-text-secondary/10 bg-background-primary p-3">
            <p className="font-medium text-sm">
              {sucursal.restaurante} — {sucursal.nombre}
            </p>
            <p className="text-text-secondary">{sucursal.direccion}</p>
          </div>
        ) : (
          <p className="text-text-secondary">Sin sucursal asignada.</p>
        )}
      </div>
      <p className="text-text-secondary">
        Entregas delivery de la sucursal:{" "}
        <span className="font-medium text-text-primary">{entregas}</span>
      </p>
    </div>
  );
}

function AdminDetail() {
  return (
    <p className="text-xs text-text-secondary">
      Acceso completo al sistema — gestión de usuarios, restaurantes y reportes.
    </p>
  );
}

/* ── Chips de apoyo ──────────────────────────────────────── */

function Stars({ count }) {
  return (
    <span className="text-star">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

const ESTADO_STYLE = {
  pendiente: "bg-status-pending-bg text-status-pending-text",
  preparando: "bg-status-progress-bg text-status-progress-text",
  listo: "bg-status-success-bg text-status-success-text",
  completado: "bg-status-success-alt-bg text-status-success-alt-text",
  en_camino: "bg-status-transit-bg text-status-transit-text",
  entregado: "bg-status-success-alt-bg text-status-success-alt-text",
};

function EstadoBadge({ estado }) {
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_STYLE[estado] || "bg-background-secondary text-text-secondary"}`}
    >
      {estado.replace("_", " ")}
    </span>
  );
}

/* ── Resumen en línea por rol ─────────────────────────────── */

function InlineSummary({ user }) {
  const d = user.detalle;
  if (user.rol === "customer") {
    return (
      <span className="text-xs text-text-secondary">
        {d.ordenes.total} pedidos · {d.resenas.total} reseñas
      </span>
    );
  }
  if (user.rol === "owner") {
    return (
      <span className="text-xs text-text-secondary">
        {d.restaurantes.length} restaurante{d.restaurantes.length !== 1 && "s"}
      </span>
    );
  }
  if (user.rol === "worker") {
    return (
      <span className="text-xs text-text-secondary">
        {d.sucursal ? d.sucursal.restaurante + " — " + d.sucursal.nombre : "Sin sucursal"}
        {" · "}{d.ordenes_atendidas} órdenes
      </span>
    );
  }
  if (user.rol === "repartidor") {
    return (
      <span className="text-xs text-text-secondary">
        {d.sucursal ? d.sucursal.restaurante + " — " + d.sucursal.nombre : "Sin sucursal"}
        {" · "}{d.entregas} entregas
      </span>
    );
  }
  return <span className="text-xs text-text-secondary">Acceso total</span>;
}

/* ── Fila expandible ─────────────────────────────────────── */

function UserRow({ user }) {
  const [open, setOpen] = useState(false);

  const DetailComponent = {
    customer: CustomerDetail,
    owner: OwnerDetail,
    worker: WorkerDetail,
    repartidor: RepartidorDetail,
    admin: AdminDetail,
  }[user.rol];

  return (
    <>
      <tr
        className="hover:bg-background-secondary/30 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3 font-medium text-text-primary">
          <span
            className={`inline-block mr-2 text-xs text-text-secondary transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {user.nombre}
        </td>
        <td className="px-4 py-3 text-text-secondary">{user.email}</td>
        <td className="px-4 py-3">
          <RolBadge rol={user.rol} />
        </td>
        <td className="px-4 py-3">
          <InlineSummary user={user} />
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block h-2 w-2 rounded-full ${user.activo ? "bg-status-success-text" : "bg-text-secondary/40"}`}
            title={user.activo ? "Activo" : "Inactivo"}
          />
        </td>
        <td className="px-4 py-3 text-text-secondary">
          {formatDate(user.creado_en)}
        </td>
      </tr>
      {open && (
        <tr>
          <td
            colSpan={6}
            className="bg-background-secondary/20 px-6 py-4 border-b border-text-secondary/10"
          >
            {DetailComponent ? (
              <DetailComponent data={user.detalle} />
            ) : (
              <p className="text-xs text-text-secondary">Sin datos adicionales.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Tabla principal ─────────────────────────────────────── */

export default function UsuariosTable({ usuarios }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-text-secondary/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-text-secondary/10 bg-background-secondary/60">
            <th className="px-4 py-3 font-medium text-text-secondary">
              Nombre
            </th>
            <th className="px-4 py-3 font-medium text-text-secondary">
              Email
            </th>
            <th className="px-4 py-3 font-medium text-text-secondary">Rol</th>
            <th className="px-4 py-3 font-medium text-text-secondary">
              Resumen
            </th>
            <th className="px-4 py-3 font-medium text-text-secondary text-center">
              Estado
            </th>
            <th className="px-4 py-3 font-medium text-text-secondary">
              Registrado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-text-secondary/10">
          {usuarios.map((u) => (
            <UserRow key={u._id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
