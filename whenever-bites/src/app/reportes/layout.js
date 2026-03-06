import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function ReportesLayout({ children }) {
  const user = await requireSessionUser(["owner", "admin"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
