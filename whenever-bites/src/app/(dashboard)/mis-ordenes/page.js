import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Mis órdenes",
};

export default async function MisOrdenesPage() {
  await requireSessionUser(["customer"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Mis órdenes</h2>
      <p className="text-text-secondary">
        Vista habilitada solo para customer según el scope del proyecto.
      </p>
    </div>
  );
}
