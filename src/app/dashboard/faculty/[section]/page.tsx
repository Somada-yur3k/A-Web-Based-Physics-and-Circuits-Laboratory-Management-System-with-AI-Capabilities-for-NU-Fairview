import BlankDashboardSection from "@/features/lab-dashboard/blank-section";
import FacultyServiceRequest from "@/features/lab-dashboard/faculty-service-request";
import RequestQueue from "@/features/demo-requests/request-queue";
import { roleSections } from "@/features/lab-dashboard/config";
import { requireDemoRole } from "@/features/demo-auth/session";

export function generateStaticParams() {
  return roleSections.faculty.map(({ slug }) => ({ section: slug }));
}

export default async function FacultySection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("faculty");
  const { section } = await params;
  if (section === "service-request") return <FacultyServiceRequest />;
  if (section === "reservation-status") return <RequestQueue mode="own" requesterRole="faculty" />;
  return <BlankDashboardSection role="faculty" section={section} />;
}
