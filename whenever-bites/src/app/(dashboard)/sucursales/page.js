import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Sucursales — Owner",
};

export default async function SucursalesPage() {
  await requireSessionUser(["owner"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Sucursales</h2>
      <p className="text-text-secondary">
        Vista exclusiva para owner: consulta y seguimiento de sucursales.
      </p>
    </div>
  );
}
