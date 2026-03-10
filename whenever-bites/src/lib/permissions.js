import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";

export const ROLE_HOME = {
  admin: "/usuarios",
  owner: "/menu",
  worker: "/cola",
  repartidor: "/entregas",
  customer: "/home",
};

export const ROLE_LABELS = {
  admin: "Administrador",
  owner: "Propietario",
  worker: "Cocina",
  repartidor: "Repartidor",
  customer: "Cliente",
};

export const ROLE_NAV_ITEMS = {
  admin: [
    { href: "/usuarios", label: "Usuarios" },
    { href: "/restaurantes", label: "Restaurantes" },
    { href: "/limpieza", label: "Limpieza" },
    { href: "/reportes", label: "Reportes" },
  ],
  owner: [
    { href: "/menu", label: "Menú" },
    { href: "/sucursales", label: "Sucursales" },
    { href: "/reportes", label: "Reportes" },
  ],
  worker: [{ href: "/cola", label: "Cola de órdenes" }],
  repartidor: [{ href: "/entregas", label: "Entregas" }],
  customer: [
    { href: "/home", label: "Inicio" },
    { href: "/mis-ordenes", label: "Mis órdenes" },
    { href: "/mis-resenas", label: "Mis reseñas" },
    { href: "/mis-direcciones", label: "Mis direcciones" },
  ],
};

async function decodeSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const { valid, payload } = verifyAccessToken(token);
  if (!valid || !payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    rol: payload.rol,
  };
}

export async function getSessionUser() {
  return decodeSessionToken();
}

export async function requireSessionUser(allowedRoles = []) {
  const user = await decodeSessionToken();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    redirect(ROLE_HOME[user.rol] || "/");
  }

  return user;
}