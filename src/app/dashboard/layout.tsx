import { requireDemoSession } from "@/features/demo-auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireDemoSession();
  return children;
}
