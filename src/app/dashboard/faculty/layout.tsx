import LabDashboardShell from "@/components/dashboard/lab-dashboard-shell";
import "@/features/lab-dashboard/dashboard.css";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  await requireDemoRole("faculty");
  return <LabDashboardShell role="faculty">{children}</LabDashboardShell>;
}
