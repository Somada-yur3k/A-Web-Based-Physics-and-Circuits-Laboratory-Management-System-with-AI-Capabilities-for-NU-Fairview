import DashboardHome from "@/features/lab-dashboard/dashboard-home";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function FacultyDashboard() {
  await requireDemoRole("faculty");
  return <DashboardHome role="faculty" />;
}
