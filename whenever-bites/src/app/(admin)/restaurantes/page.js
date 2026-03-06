export const metadata = {
  title: "Restaurantes — Admin",
};

export default async function RestaurantesPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Gestión de restaurantes</h2>
      <p className="text-text-secondary">
        Vista exclusiva para admin: administración de restaurantes y sucursales.
      </p>
    </div>
  );
}
