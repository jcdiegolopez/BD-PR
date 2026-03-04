import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Menú — Owner",
};

export default async function MenuPage() {
  await requireSessionUser(["owner"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Gestión de menú</h2>
      <p className="text-text-secondary">
        Vista exclusiva para owner: categorías y platillos de su restaurante.
      </p>
    </div>
  );
}
