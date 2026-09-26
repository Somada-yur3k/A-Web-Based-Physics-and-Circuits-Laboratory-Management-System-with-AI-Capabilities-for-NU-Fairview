import { notFound } from "next/navigation";
import StaffPage, { type StaffSection } from "@/features/staff/staff-page";
import { staffNavigation } from "@/features/staff/config";
import { requireDemoRole } from "@/features/demo-auth/session";
export function generateStaticParams() { return staffNavigation.filter(item => item.slug).map(({ slug }) => ({ section: slug })); }
export default async function CircuitsSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("circuits-staff");
  const { section } = await params;
  if (!staffNavigation.some(item => item.slug === section && item.slug !== "")) notFound();
  return <StaffPage laboratory="circuits" section={section as StaffSection} />;
}
