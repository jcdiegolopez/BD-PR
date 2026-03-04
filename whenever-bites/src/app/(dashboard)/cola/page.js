import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Cola — Worker",
};

export default async function ColaPage() {
  await requireSessionUser(["worker"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Cola de órdenes</h2>
      <p className="text-text-secondary">
        Vista exclusiva para worker: pendientes y preparando por sucursal.
      </p>
    </div>
  );
}
