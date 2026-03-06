const STYLES = {
  admin: "bg-accent/10 text-accent",
  owner: "bg-role-owner-bg text-role-owner-text",
  worker: "bg-role-worker-bg text-role-worker-text",
  repartidor: "bg-role-repartidor-bg text-role-repartidor-text",
  customer: "bg-role-customer-bg text-role-customer-text",
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
