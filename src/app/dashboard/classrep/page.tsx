import DashboardHome from "@/features/lab-dashboard/dashboard-home";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function ClassRepDashboard() {
  await requireDemoRole("classrep");
  return <DashboardHome role="classrep" />;
}
