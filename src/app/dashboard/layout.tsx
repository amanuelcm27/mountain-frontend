import { DashboardShell } from "@/components/dashboard-shell";
import "./dashboard.css";
import "./dashboard-shell.css";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
