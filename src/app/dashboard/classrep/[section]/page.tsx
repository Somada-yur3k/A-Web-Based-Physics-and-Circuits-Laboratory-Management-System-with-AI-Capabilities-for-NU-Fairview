import BlankDashboardSection from "@/features/lab-dashboard/blank-section";
import { roleRouteAliases, roleSections } from "@/features/lab-dashboard/config";
import { requireDemoRole } from "@/features/demo-auth/session";
import LaboratoryServiceRequest from "@/features/lab-dashboard/laboratory-service-request";
import RequestQueue from "@/features/demo-requests/request-queue";

export function generateStaticParams() {
  return [...roleSections.classrep.map(({ slug }) => ({ section: slug })), ...Object.keys(roleRouteAliases.classrep).map((section) => ({ section }))];
}

export default async function ClassRepSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("classrep");
  const { section } = await params;
  if (section === "service-request") return <LaboratoryServiceRequest />;
  if (section === "my-reservations") return <RequestQueue mode="own" requesterRole="classrep" />;
  return <BlankDashboardSection role="classrep" section={section} />;
}
