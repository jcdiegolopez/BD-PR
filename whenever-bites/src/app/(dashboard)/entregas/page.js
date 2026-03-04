import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Entregas — Repartidor",
};

export default async function EntregasPage() {
  await requireSessionUser(["repartidor"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Entregas</h2>
      <p className="text-text-secondary">
        Vista exclusiva para repartidor: órdenes listas y en camino.
      </p>
    </div>
  );
}
