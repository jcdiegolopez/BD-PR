import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function WorkerLayout({ children }) {
  const user = await requireSessionUser(["worker"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
