"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Mountain,
  Package,
  Settings,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/menu", label: "Menu", icon: Package },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <Mountain size={22} /> Mountain Cafe
        </div>
        <div className="nav-label">Workspace</div>
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${pathname === href ? "active" : ""}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <div className="sidebar-bottom">
          <div className="nav-link">
            <div className="avatar">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span>{user?.first_name || user?.email || "Administrator"}</span>
          </div>
          <button className="nav-link" onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="crumbs">
            Mountain Cafe /{" "}
            <strong>{pathname.includes("menu") ? "Menu" : "Overview"}</strong>
          </span>
          <div className="top-actions">
            <span className="muted">
              Good morning{user?.first_name ? `, ${user.first_name}` : ""}
            </span>
            <div className="avatar">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
