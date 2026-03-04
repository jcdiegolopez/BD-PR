import RoleNavigation from "@/components/navigation/RoleNavigation";
import {
  ROLE_LABELS,
  ROLE_NAV_ITEMS,
  requireSessionUser,
} from "@/lib/permissions";

export default async function DashboardLayout({ children }) {
  const user = await requireSessionUser();
  const navItems = ROLE_NAV_ITEMS[user.rol] || [];
  const roleLabel = ROLE_LABELS[user.rol] || user.rol;

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <RoleNavigation user={user} items={navItems} roleLabel={roleLabel} />

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-text-secondary/10 bg-background-primary px-6 md:px-10">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{roleLabel}</span>
            {" · "}
            {user.email}
          </p>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}