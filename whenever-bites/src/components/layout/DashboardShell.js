import RoleNavigation from "@/components/navigation/RoleNavigation";
import { ROLE_LABELS, ROLE_NAV_ITEMS } from "@/lib/permissions";

export default function DashboardShell({ user, children }) {
  const navItems = ROLE_NAV_ITEMS[user.rol] || [];
  const roleLabel = ROLE_LABELS[user.rol] || user.rol;

  return (
    <div className="flex min-h-screen">
      <RoleNavigation user={user} items={navItems} roleLabel={roleLabel} />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-accent/10 bg-background-primary px-6 md:px-10">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{roleLabel}</span>
            {" · "}
            {user.email}
          </p>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
