import { redirect } from "next/navigation";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function AdminDashboard() {
  await requireDemoRole("headlab");
  redirect("/dashboard/head-laboratory/account-management");
}
