import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Usuarios — Admin",
};

export default async function UsuariosPage() {
  await requireSessionUser(["admin"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Gestión de usuarios</h2>
      <p className="text-text-secondary">
        Vista exclusiva para admin: listado y control de usuarios por rol.
      </p>
    </div>
  );
}
