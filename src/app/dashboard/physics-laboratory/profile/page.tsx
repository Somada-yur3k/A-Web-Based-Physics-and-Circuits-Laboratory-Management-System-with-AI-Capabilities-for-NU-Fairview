import { requireDemoRole } from "@/features/demo-auth/session";

export default async function PhysicsLaboratoryProfilePage() {
  await requireDemoRole("physics-staff");
  return <main className="admin-blank-page" aria-label="Physics Laboratory Profile" />;
}
