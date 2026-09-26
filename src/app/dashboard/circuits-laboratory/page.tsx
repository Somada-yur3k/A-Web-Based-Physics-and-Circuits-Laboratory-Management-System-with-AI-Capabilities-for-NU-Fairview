import StaffPage from "@/features/staff/staff-page";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function CircuitsLaboratoryDashboard() {
  await requireDemoRole("circuits-staff");
  return <StaffPage laboratory="circuits" />;
}
