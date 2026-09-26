import AdminShell from "@/components/admin/admin-shell";
import { requireDemoRole } from "@/features/demo-auth/session";
import { staffWorkspace } from "@/features/staff/config";
import "@/app/dashboard/head-laboratory/admin.css";
import "@/features/staff/staff.css";

export default async function PhysicsLaboratoryLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDemoRole("physics-staff");
  return <AdminShell user={user} workspace={staffWorkspace("physics")}>{children}</AdminShell>;
}
