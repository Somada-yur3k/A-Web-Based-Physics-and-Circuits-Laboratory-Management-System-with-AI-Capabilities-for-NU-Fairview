import AdminShell from "@/components/admin/admin-shell";
import "./admin.css";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDemoRole("headlab");
  return <AdminShell user={user}>{children}</AdminShell>;
}
