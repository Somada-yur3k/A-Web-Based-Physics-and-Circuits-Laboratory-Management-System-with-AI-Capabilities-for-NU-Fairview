import RequestQueue from "@/features/demo-requests/request-queue";
import { requireDemoRole } from "@/features/demo-auth/session";

export default async function DeanDashboard() {
  await requireDemoRole("dean");
  return <RequestQueue />;
}
