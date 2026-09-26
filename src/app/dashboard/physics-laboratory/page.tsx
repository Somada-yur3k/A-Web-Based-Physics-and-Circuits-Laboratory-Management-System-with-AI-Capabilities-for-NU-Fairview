import StaffPage from "@/features/staff/staff-page";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function PhysicsLaboratoryDashboard() {
  await requireDemoRole("physics-staff");
  return <StaffPage laboratory="physics" />;
}
