import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Mis reseñas",
};

export default async function MisResenasPage() {
  await requireSessionUser(["customer"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Mis reseñas</h2>
      <p className="text-text-secondary">
        Desde aquí customer puede revisar y administrar sus reseñas.
      </p>
    </div>
  );
}
