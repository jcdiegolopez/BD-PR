import { requireSessionUser } from "@/lib/permissions";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function OwnerLayout({ children }) {
  const user = await requireSessionUser(["owner"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
