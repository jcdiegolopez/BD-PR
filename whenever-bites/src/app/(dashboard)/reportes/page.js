import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Reportes",
};

export default async function ReportesPage() {
  await requireSessionUser(["owner", "admin"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Reportes analíticos</h2>
      <p className="text-text-secondary">
        Vista compartida por owner y admin para R1, R2, R3 y R4.
      </p>
    </div>
  );
}