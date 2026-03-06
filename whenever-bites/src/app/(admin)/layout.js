import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function AdminLayout({ children }) {
  const user = await requireSessionUser(["admin"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
