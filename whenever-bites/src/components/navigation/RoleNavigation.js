"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RoleNavigation({ user, items = [], roleLabel }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile toggle button ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-text-contrast shadow-lg shadow-accent/25 transition-colors duration-200 hover:bg-accent-dark md:hidden"
        aria-label="Abrir menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* ── Overlay for mobile ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-text-primary/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-accent-dark/20 bg-background-accent text-text-contrast shadow-[18px_0_40px_-28px_rgba(96,13,26,0.65)] transition-transform duration-300 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <Link href="/" className="text-xl font-semibold text-text-contrast">
            Whenever<span className="text-background-primary">Bites</span>
            <span className="text-[#FFD8B5]">.</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-contrast/75 transition-colors duration-200 hover:bg-white/10 hover:text-text-contrast md:hidden"
            aria-label="Cerrar menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-background-primary text-accent shadow-sm"
                    : "text-text-contrast/90 hover:bg-white/10 hover:text-text-contrast"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 space-y-0.5">
            <p className="truncate text-sm font-medium text-text-contrast">
              {user.email}
            </p>
            <p className="text-xs text-[#FFD8B5]">{roleLabel}</p>
          </div>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-contrast/80 transition-colors duration-200 hover:bg-white/10 hover:text-text-contrast"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
            Cerrar sesión
          </a>
        </div>
      </aside>
    </>
  );
}