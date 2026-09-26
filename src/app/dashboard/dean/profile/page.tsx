import { requireDemoRole } from "@/features/demo-auth/session";
export default async function DeanProfilePage() {
  await requireDemoRole("dean");
  return <main className="lab-blank-page" aria-label="Dean Profile" />;
}
