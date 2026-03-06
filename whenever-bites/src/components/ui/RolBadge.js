const STYLES = {
  admin: "bg-accent/10 text-accent",
  owner: "bg-purple-100 text-purple-700",
  worker: "bg-blue-100 text-blue-700",
  repartidor: "bg-amber-100 text-amber-700",
  customer: "bg-emerald-100 text-emerald-700",
};

const LABELS = {
  admin: "Admin",
  owner: "Propietario",
  worker: "Cocina",
  repartidor: "Repartidor",
  customer: "Cliente",
};

export default function RolBadge({ rol }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${STYLES[rol] || "bg-background-secondary text-text-secondary"}`}
    >
      {LABELS[rol] || rol}
    </span>
  );
}
