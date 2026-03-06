import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function RepartidorLayout({ children }) {
  const user = await requireSessionUser(["repartidor"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
