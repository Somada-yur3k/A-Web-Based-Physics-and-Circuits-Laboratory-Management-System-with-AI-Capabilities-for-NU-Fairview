import { notFound } from "next/navigation";
import { adminSections } from "@/components/admin/navigation";
import { requireDemoRole } from "@/features/demo-auth/session";
import HeadlabInventoryPage from "@/features/staff/headlab-inventory-page";
import HeadlabRequestsPage from "@/features/staff/headlab-requests-page";
import HeadlabSchedulePage from "@/features/lab-dashboard/headlab-schedule-page";

export function generateStaticParams() {
  return adminSections.filter(({ slug }) => slug !== "account-management").map(({ slug }) => ({ section: slug }));
}

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  await requireDemoRole("headlab");
  const { section } = await params;
  const item = adminSections.find(({ slug }) => slug === section && slug !== "account-management");
  if (!item) notFound();
  if (section === "inventory-overview") return <HeadlabInventoryPage />;
  if (section === "reservation-requests") return <HeadlabRequestsPage />;
  if (section === "schedule-management") return <HeadlabSchedulePage />;
  return <main className="admin-blank-page" aria-label={item.label} />;
}
