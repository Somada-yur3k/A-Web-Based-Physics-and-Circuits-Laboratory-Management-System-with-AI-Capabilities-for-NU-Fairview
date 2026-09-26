import BlankDashboardSection from "@/features/lab-dashboard/blank-section";
import { roleRouteAliases, roleSections } from "@/features/lab-dashboard/config";
import { requireDemoRole } from "@/features/demo-auth/session";
import LaboratoryServiceRequest from "@/features/lab-dashboard/laboratory-service-request";

export function generateStaticParams() {
  return [...roleSections.classrep.map(({ slug }) => ({ section: slug })), ...Object.keys(roleRouteAliases.classrep).map((section) => ({ section }))];
}

export default async function ClassRepSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("classrep");
  const { section } = await params;
  if (section === "service-request") return <LaboratoryServiceRequest />;
  return <BlankDashboardSection role="classrep" section={section} />;
}
