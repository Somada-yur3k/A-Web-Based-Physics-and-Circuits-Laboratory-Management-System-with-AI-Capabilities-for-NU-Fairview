import LabDashboardShell from "@/components/dashboard/lab-dashboard-shell";
import { requireDemoRole } from "@/features/demo-auth/session";
import "@/features/lab-dashboard/dashboard.css";

export default async function DeanLayout({ children }: { children: React.ReactNode }) {
  await requireDemoRole("dean");
  return <LabDashboardShell role="dean">{children}</LabDashboardShell>;
}
