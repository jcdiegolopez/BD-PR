import { requireSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Inicio — Customer",
};

export default async function CustomerHomePage() {
  const user = await requireSessionUser(["customer"]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Inicio de cliente</h2>
      <p className="text-text-secondary">
        Hola, {user.email}. Aquí puedes explorar restaurantes y gestionar tus
        acciones como customer.
      </p>
    </div>
  );
}