import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function CustomerLayout({ children }) {
  const user = await requireSessionUser(["customer"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
