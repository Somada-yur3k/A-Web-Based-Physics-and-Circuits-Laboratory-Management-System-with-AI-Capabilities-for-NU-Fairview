import BlankDashboardSection from "@/features/lab-dashboard/blank-section";
import { roleSections } from "@/features/lab-dashboard/config";
import { requireDemoRole } from "@/features/demo-auth/session";

export function generateStaticParams() {
  return roleSections.faculty.map(({ slug }) => ({ section: slug }));
}

export default async function FacultySection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("faculty");
  const { section } = await params;
  return <BlankDashboardSection role="faculty" section={section} />;
}
